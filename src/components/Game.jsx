import { useState, useEffect, useCallback, useRef } from "react";
import Card from "./Card";
import GameSetupModal from "./GameSetupModal";
import { getAvatarUrl, getMaxCardId } from "../assets";
import WebRTCService from "../services/WebRTCService";
import "./Avatar.css";

// Game component for the Matchlet game

const Game = ({ triggerReset, onResetComplete, gameMode }) => {
  // WebRTC service for online play
  const webRTCServiceRef = useRef(null);
  const [onlineStatus, setOnlineStatus] = useState({
    connected: false,
    roomId: null,
    isHost: false,
    players: [],
    error: null,
  });
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedSets, setMatchedSets] = useState([]);
  const [canFlipThird, setCanFlipThird] = useState(false);
  const [_score, setScore] = useState(0); // Using underscore prefix to indicate intentionally unused state
  const [moves, setMoves] = useState(0);
  const [modalOpened, setModalOpened] = useState(false);
  const [gameConfig, setGameConfig] = useState({
    boardSize: "md",
    gridCols: 6,
    gridRows: 3,
    players: [
      { name: "Player 1", color: "primary", avatar: "0201e35304ee6e58.svg" },
    ],
    cardset: "emojis", // Default cardset
  });

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerScores, setPlayerScores] = useState([0]);

  // Helper function to generate cards with values that can form triplets
  const generateCards = useCallback(() => {
    // Calculate total cards based on grid size
    const totalCards = gameConfig.gridCols * gameConfig.gridRows;

    // Determine how many unique values we need (each appears 3 times)
    const uniqueValues = Math.floor(totalCards / 3);

    // For cardset randomization - we'll use a larger pool of possible card values
    const maxCardValue = getMaxCardId(gameConfig.cardset);

    // Create an array of possible card values (1-20) and shuffle it
    const possibleValues = Array.from(
      { length: maxCardValue },
      (_, i) => i + 1
    ).sort(() => Math.random() - 0.5);

    // Take just the number of unique values we need from the shuffled array
    const selectedValues = possibleValues.slice(0, uniqueValues);

    // Create sets of cards (each value appearing 3 times)
    const values = [];
    for (const value of selectedValues) {
      values.push(value, value, value); // Each value appears 3 times
    }

    // If we have remaining slots, add some extra cards
    const remaining = totalCards - values.length;
    if (remaining > 0 && selectedValues.length > 0) {
      for (let i = 0; i < remaining; i++) {
        values.push(selectedValues[0]); // Use the first selected value for extras
      }
    }

    // Shuffle the values
    const shuffledValues = [...values].sort(() => Math.random() - 0.5);

    // Create card objects
    const newCards = shuffledValues.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
    }));

    return newCards;
  }, [gameConfig.gridCols, gameConfig.gridRows, gameConfig.cardset]);

  // Wrap moveToNextPlayer in useCallback to avoid dependency issues
  const moveToNextPlayer = useCallback(() => {
    setCurrentPlayerIndex(
      (prevIndex) => (prevIndex + 1) % gameConfig.players.length
    );
  }, [gameConfig.players.length]);

  // Helper function to determine if a card is disabled
  const isCardDisabled = (id) => {
    const card = cards.find((card) => card.id === id);
    return (
      card.isMatched ||
      flippedCards.length === 3 ||
      (flippedCards.length === 2 && !canFlipThird)
    );
  };

  // Helper function to get the grid columns class based on grid size with responsive breakpoints
  const getGridColsClass = (cols) => {
    switch (cols) {
      case 3:
        return "grid-cols-2 sm:grid-cols-3";
      case 4:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
      case 5:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
      case 6:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
      case 8:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8";
      case 9:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9";
      default:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
    }
  };

  // Handle card click
  const handleCardClick = (id) => {
    // If we already have 2 cards flipped and can't flip a third, or we have 3 cards flipped, do nothing
    if (
      (flippedCards.length === 2 && !canFlipThird) ||
      flippedCards.length === 3
    ) {
      return;
    }

    // In online mode, only allow the current player to make moves
    if (gameMode?.mode === "online" && currentPlayerIndex !== 0) {
      return;
    }

    // Flip the card
    setCards(
      cards.map((card) =>
        card.id === id ? { ...card, isFlipped: true } : card
      )
    );

    // Add to flipped cards
    setFlippedCards([...flippedCards, id]);

    // Increment moves if this is the first
    if (flippedCards.length === 0) {
      setMoves(moves + 1);
    }

    // If in online mode, sync the game state
    if (gameMode?.mode === "online" && webRTCServiceRef.current) {
      // Small delay to ensure state updates have been processed
      setTimeout(() => {
        webRTCServiceRef.current.sendGameState({
          cards: cards.map((card) =>
            card.id === id ? { ...card, isFlipped: true } : card
          ),
          flippedCards: [...flippedCards, id],
          matchedSets,
          playerScores,
          currentPlayerIndex,
          moves:
            flippedCards.length === 0 || flippedCards.length === 2
              ? moves + 1
              : moves,
        });
      }, 50);
    }
  };

  // Check for matches when flipped cards change
  useEffect(() => {
    // Don't do anything if no cards are flipped
    if (flippedCards.length === 0) return;

    // If we have 2 cards flipped, check if they match
    if (flippedCards.length === 2) {
      const firstCardId = flippedCards[0];
      const secondCardId = flippedCards[1];
      const firstCard = cards.find((card) => card.id === firstCardId);
      const secondCard = cards.find((card) => card.id === secondCardId);

      // If they match, allow flipping a third card
      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        setCanFlipThird(true);
      } else {
        // If they don't match, flip them back after a delay
        const timer = setTimeout(() => {
          setCards(
            cards.map((card) => {
              if (flippedCards.includes(card.id)) {
                return { ...card, isFlipped: false };
              }
              return card;
            })
          );
          setFlippedCards([]);
          moveToNextPlayer();
        }, 1000);

        return () => clearTimeout(timer);
      }
    }

    // If we have 3 cards flipped, check if they all match
    if (flippedCards.length === 3) {
      const firstCardId = flippedCards[0];
      const secondCardId = flippedCards[1];
      const thirdCardId = flippedCards[2];

      const firstCard = cards.find((card) => card.id === firstCardId);
      const secondCard = cards.find((card) => card.id === secondCardId);
      const thirdCard = cards.find((card) => card.id === thirdCardId);

      // Check if all three cards have the same value
      const isMatch =
        firstCard &&
        secondCard &&
        thirdCard &&
        firstCard.value === secondCard.value &&
        secondCard.value === thirdCard.value;

      // Use a timeout to handle the match or non-match
      const timer = setTimeout(
        () => {
          if (isMatch) {
            // Mark the cards as matched
            setCards(
              cards.map((card) => {
                if (flippedCards.includes(card.id)) {
                  return { ...card, isMatched: true };
                }
                return card;
              })
            );

            // Add to matched sets if not already included
            setMatchedSets((prev) => {
              if (!prev.includes(firstCard.value)) {
                return [...prev, firstCard.value];
              }
              return prev;
            });

            // Add 1 point to score (1 point per match)
            setScore((prev) => prev + 1);

            // Add 1 point to current player's score (1 point per match)
            setPlayerScores((prev) => {
              const newScores = [...prev];
              newScores[currentPlayerIndex] = newScores[currentPlayerIndex] + 1;
              return newScores;
            });
          } else {
            // If they don't match, flip them back
            setCards(
              cards.map((card) => {
                if (flippedCards.includes(card.id)) {
                  return { ...card, isFlipped: false };
                }
                return card;
              })
            );
            moveToNextPlayer();
          }

          // Always reset flipped cards and canFlipThird after handling
          setFlippedCards([]);
          setCanFlipThird(false);
        },
        isMatch ? 300 : 1000
      );

      return () => clearTimeout(timer);
    }
  }, [flippedCards, cards, currentPlayerIndex, moveToNextPlayer]);

  // Wrap initializeGame in useCallback to avoid dependency issues
  const initializeGame = useCallback(() => {
    const newCards = generateCards();
    setCards(newCards);
    setFlippedCards([]);
    setMatchedSets([]);
    setCanFlipThird(false);
    setScore(0);
    setMoves(0);

    // Initialize player scores
    const newPlayerScores = gameConfig.players.map(() => 0);
    setPlayerScores(newPlayerScores);
    setCurrentPlayerIndex(0);
  }, [gameConfig.players, generateCards]);

  useEffect(() => {
    if (!modalOpened) {
      initializeGame();
    }
  }, [modalOpened, gameConfig, initializeGame]);

  // Handle reset from App component
  useEffect(() => {
    if (triggerReset) {
      // Clean up WebRTC connections if they exist
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.disconnect();
        webRTCServiceRef.current = null;
      }

      // Only show the game setup modal if we have a game mode selected
      if (gameMode) {
        setModalOpened(true);
      }
      onResetComplete();
    }
  }, [triggerReset, onResetComplete, gameMode]);

  // Initialize WebRTC for online play
  useEffect(() => {
    if (gameMode?.mode === "online" && gameMode?.roomId) {
      // Create WebRTC service if it doesn't exist
      if (!webRTCServiceRef.current) {
        webRTCServiceRef.current = new WebRTCService();

        // Set up event handlers
        webRTCServiceRef.current.onPlayerJoined = (userId) => {
          setOnlineStatus((prev) => ({
            ...prev,
            players: [...prev.players, userId],
          }));
        };

        webRTCServiceRef.current.onPlayerLeft = (userId) => {
          setOnlineStatus((prev) => ({
            ...prev,
            players: prev.players.filter((id) => id !== userId),
          }));
        };

        webRTCServiceRef.current.onGameStateUpdate = (state) => {
          // Update local game state from received state
          if (state.cards) setCards(state.cards);
          if (state.flippedCards) setFlippedCards(state.flippedCards);
          if (state.matchedSets) setMatchedSets(state.matchedSets);
          if (state.playerScores) setPlayerScores(state.playerScores);
          if (state.currentPlayerIndex !== undefined)
            setCurrentPlayerIndex(state.currentPlayerIndex);
          if (state.moves !== undefined) setMoves(state.moves);
        };

        // Connect to signaling server
        try {
          // Use the signaling server URL from environment variables
          const serverUrl = import.meta.env.VITE_SIGNALING_URL || "https://matchlet-signaling.onrender.com";
          const localUserId = webRTCServiceRef.current.connect(
            serverUrl,
            gameMode.roomId,
            gameMode.isHost
          );

          setOnlineStatus({
            connected: true,
            roomId: gameMode.roomId,
            isHost: gameMode.isHost,
            players: [localUserId],
            error: null,
          });
        } catch (error) {
          console.error("Failed to connect to signaling server:", error);
          setOnlineStatus((prev) => ({
            ...prev,
            error: "Failed to connect to signaling server",
          }));
        }
      }
    }

    // Cleanup function
    return () => {
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.disconnect();
      }
    };
  }, [gameMode]);

  // Handle game start from the GameSetupModal
  const handleStartGame = (config) => {
    setGameConfig(config);
    setModalOpened(false);
    initializeGame();

    // If in online mode, sync the initial game state
    if (gameMode?.mode === "online" && webRTCServiceRef.current) {
      // Small delay to ensure state updates have been processed
      setTimeout(() => {
        const newCards = generateCards();
        webRTCServiceRef.current.sendGameState({
          cards: newCards,
          flippedCards: [],
          matchedSets: [],
          playerScores: config.players.map(() => 0),
          currentPlayerIndex: 0,
          moves: 0,
        });
      }, 100);
    }
  };

  const resetGame = () => {
    // If in online mode and not the host, don't allow resetting
    if (gameMode?.mode === "online" && !gameMode.isHost) {
      return;
    }

    setModalOpened(true);
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-8rem)] w-full flex-col">
      {/* Online Room Info */}
      {gameMode?.mode === "online" && (
        <div className="bg-base-200 mb-2 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold">Room: </span>
              <span className="font-mono">{onlineStatus.roomId}</span>
            </div>
            <div>
              <span className="mr-2 font-bold">Status: </span>
              <span
                className={`badge ${onlineStatus.connected ? "badge-success" : "badge-error"}`}
              >
                {onlineStatus.connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div>
              <span className="mr-2 font-bold">Players: </span>
              <span className="badge badge-info">
                {onlineStatus.players.length}
              </span>
            </div>
          </div>
          {onlineStatus.error && (
            <div className="text-error mt-1 text-sm">{onlineStatus.error}</div>
          )}
        </div>
      )}
      <div className="grid h-full grid-cols-1 gap-4 overflow-auto md:grid-cols-4 lg:grid-cols-5">
        {/* Left sidebar - Player info */}
        <div className="overflow-y-auto md:col-span-1">
          <div className="bg-base-200 rounded-lg p-4 shadow-md">
            <h2 className="font-bubblegum text-primary mb-4 text-xl">
              Players
            </h2>
            <div className="space-y-4">
              {gameConfig.players.map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg p-3 ${currentPlayerIndex === index ? "bg-base-300 shadow-md" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div
                        className={`ring-primary ring-offset-base-100 w-12 rounded-full ring ring-offset-2 ${currentPlayerIndex === index ? "tw-avatar-ping" : ""}`}
                      >
                        <img
                          src={
                            getAvatarUrl(player.avatar) ||
                            `${import.meta.env.BASE_URL}avatars/${player.avatar}`
                          }
                          alt={`${player.name}'s avatar`}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-schoolbell text-lg">{player.name}</p>
                      <p className="text-sm">
                        Score:{" "}
                        <span className="font-bold">{playerScores[index]}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-base-200 mt-6 rounded-lg p-4 shadow-md">
            <h2 className="font-bubblegum text-primary mb-4 text-xl">
              Game Info
            </h2>
            <div className="space-y-2">
              <p className="font-comic text-lg">
                Moves: <span className="font-bold">{moves}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Main game area */}
        <div className="bg-base-200/50 h-full overflow-y-auto rounded-lg p-4 shadow-inner md:col-span-3 lg:col-span-4">
          <div
            className={`grid gap-4 ${getGridColsClass(gameConfig.gridCols)} w-full auto-rows-min pb-4`}
          >
            {cards.map((card) => (
              <Card
                key={card.id}
                id={card.id}
                value={card.value}
                isFlipped={card.isFlipped}
                isMatched={card.isMatched}
                onClick={handleCardClick}
                disabled={isCardDisabled(card.id)}
                cardset={gameConfig.cardset}
              />
            ))}
          </div>

          {canFlipThird && flippedCards.length === 2 && (
            <div className="toast toast-end toast-bottom z-50">
              <div className="alert alert-success shadow-lg">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-comic font-bold">
                    Cards match! You can flip a third card now.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Matched Sets section removed as requested */}
        </div>
      </div>

      {/* Game Setup Modal */}
      <GameSetupModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onStartGame={handleStartGame}
      />

      {matchedSets.length === 9 && (
        <div className="card bg-base-100 mt-8 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-success text-2xl">
              🎉 Congratulations! 🎉
            </h2>
            <p className="text-lg">
              You've completed the game in{" "}
              <span className="font-bold">{moves}</span> moves!
            </p>

            {gameConfig.players.length > 1 && (
              <div className="mt-2">
                <h3 className="mb-2 font-bold">Final Scores:</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {gameConfig.players.map((player, index) => (
                    <div
                      key={index}
                      className={`badge badge-lg badge-${player.color}`}
                    >
                      {player.name}: {playerScores[index]}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-actions mt-4 justify-center">
              <button className="btn btn-primary btn-lg" onClick={resetGame}>
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
