import React, { useState, useEffect, useCallback, useRef } from "react";
import PlayerList from "./PlayerList";
import GameInfo from "./GameInfo";
import CardGrid from "./CardGrid";
import Toast from "./Toast";
import WaitingRoom from "./WaitingRoom";
import GameAlreadyStarted from "./GameAlreadyStarted";
import useWebRTC from "../hooks/useWebRTC";
import { CardType, GameConfigType, GameProps } from "../types/GameTypes";
import { GameState, IWebRTCService, RoomState } from "../types/WebRTCTypes";

const Game: React.FC<GameProps> = ({
  triggerReset,
  onResetComplete,
  gameMode,
  initialGameConfig,
  onBackToMenu,
}) => {
  // Game state
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedSets, setMatchedSets] = useState<number[]>([]);
  const [playerScores, setPlayerScores] = useState<number[]>([0]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [moves, setMoves] = useState<number>(0);
  const [modalOpened, setModalOpened] = useState<boolean>(false); // Changed to false since modal is now handled by App
  const [showToast, setShowToast] = useState<boolean>(false);
  const [animatingCards, setAnimatingCards] = useState<number[]>([]);
  const [roomState, setRoomState] = useState<RoomState>(RoomState.WAITING);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [celebrationCards, setCelebrationCards] = useState<number[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfigType>(
    initialGameConfig || {
      boardSize: "md",
      gridCols: 6,
      gridRows: 3,
      players: [
        {
          name: "Player 1",
          color: "#FF5733",
          avatar: "",
        },
      ],
      cardset: "animals", // Default cardset
    }
  );

  // Initialize WebRTC hook first
  const { onlineStatus, sendGameState, isDataChannelOpen, getWebRTCService } =
    useWebRTC({
      gameMode,
      onGameStateUpdate: (state: GameState) => {
        // Handle game state updates inline to avoid dependency issues
        if (state.roomState !== undefined) setRoomState(state.roomState);
        if (state.cards) setCards(state.cards);
        if (state.flippedCards) setFlippedCards(state.flippedCards);
        if (state.matchedSets) setMatchedSets(state.matchedSets);
        if (state.playerScores) setPlayerScores(state.playerScores);
        if (state.currentPlayerIndex !== undefined)
          setCurrentPlayerIndex(state.currentPlayerIndex);
        if (state.currentPlayerId !== undefined)
          setCurrentPlayerId(state.currentPlayerId);
        if (state.moves !== undefined) setMoves(state.moves);
        // Note: Player order is now managed automatically by onlineStatus.players
      },
    });

  // Derive players list from onlineStatus for online mode, gameConfig for local mode
  const activePlayers = React.useMemo(() => {
    if (gameMode?.mode === "online") {
      // If no players yet, create initial local player
      if (onlineStatus.players.length === 0 && onlineStatus.localPlayerId) {
        return [{
          id: onlineStatus.localPlayerId,
          name: gameConfig.players[0]?.name || "Player 1",
          avatar: gameConfig.players[0]?.avatar || "1.svg",
          color: "#FF5733",
          score: 0,
        }];
      }
      
      // Create players list from onlineStatus
      return onlineStatus.players.map((playerId, index) => {
        const playerInfo = onlineStatus.playersInfo?.[playerId];
        const isLocal = playerId === onlineStatus.localPlayerId;
        
        return {
          id: playerId,
          name: isLocal 
            ? (gameConfig.players[0]?.name || "Player 1")
            : (playerInfo?.name || `Player ${index + 1}`),
          avatar: isLocal 
            ? (gameConfig.players[0]?.avatar || "1.svg")
            : (playerInfo?.avatar || "1.svg"),
          color: isLocal ? "#FF5733" : "#33C3F0",
          score: 0,
        };
      });
    } else {
      // Use gameConfig for local mode
      return gameConfig.players;
    }
  }, [gameMode?.mode, onlineStatus.players, onlineStatus.playersInfo, onlineStatus.localPlayerId, gameConfig.players]);

  // Reference to WebRTC service for checking data channel status
  const webRTCServiceRef = useRef<IWebRTCService | null>(null);

  // Note: Player info updates are now handled entirely by useWebRTC hook
  // No need for separate gameConfig.players management

  // Track if we've already set local player info to prevent loops
  const hasSetLocalPlayerInfo = useRef(false);

  // Effect to set local player info when WebRTC connects
  useEffect(() => {
    const webRTCService = getWebRTCService();
    webRTCServiceRef.current = webRTCService;

    // Set local player info when WebRTC service becomes available (only once)
    if (gameMode?.mode === "online" && webRTCService && onlineStatus.localPlayerId && !hasSetLocalPlayerInfo.current) {
      const localPlayer = gameConfig.players[0];
      console.log("🔥 Game: WebRTC service available, setting local player info:", localPlayer);
      if (localPlayer) {
        const playerInfo = {
          name: localPlayer.name || "Player",
          avatar: localPlayer.avatar || "1.svg",
        };
        console.log("🔥 Game: Calling setLocalPlayerInfo with:", playerInfo);
        webRTCService.setLocalPlayerInfo(playerInfo);
        hasSetLocalPlayerInfo.current = true;
      }
    }
  }, [getWebRTCService, gameMode?.mode, onlineStatus.localPlayerId, gameConfig.players]);

  // Helper function to broadcast game state to all peers
  const broadcastGameState = useCallback(
    (state: GameState) => {
      if (gameMode?.mode !== "online") return;

      console.log("=== broadcastGameState ===");

      // Check if data channel is open
      const dataChannelOpen = isDataChannelOpen();

      console.log("Broadcasting game state:", {
        currentPlayerIndex: state.currentPlayerIndex,
        flippedCardsCount: state.flippedCards?.length,
        matchedSetsCount: state.matchedSets?.length,
        isDataChannelOpen: dataChannelOpen,
        players: onlineStatus.players,
        localPlayerId: onlineStatus.localPlayerId,
      });

      if (!dataChannelOpen) {
        console.error("Data channel not open, cannot broadcast game state");
        return;
      }

      // Add player order to ensure consistent turn validation across peers
      const stateWithPlayerOrder = {
        ...state,
        playerOrder: onlineStatus.players,
      };

      sendGameState(stateWithPlayerOrder);
    },
    [gameMode, onlineStatus.players, onlineStatus.localPlayerId, sendGameState, isDataChannelOpen]
  );

  // Initialize game when component mounts or when reset is triggered
  useEffect(() => {
    if (triggerReset) {
      resetGame();
      onResetComplete();
    }
  }, [triggerReset, onResetComplete]);

  // Initialize game when initialGameConfig changes
  useEffect(() => {
    if (initialGameConfig) {
      setGameConfig(initialGameConfig);
      initializeGame();
    }
  }, [initialGameConfig]);

  // Generate cards for the game
  const generateCards = () => {
    // Get grid size from game config
    const { gridCols, gridRows } = gameConfig;
    const totalCards = gridCols * gridRows;

    // Ensure we have a number of cards divisible by 3
    const remainder = totalCards % 3;
    const adjustedTotal = remainder === 0 ? totalCards : totalCards - remainder;

    // Create triplets of cards
    const uniqueValues = adjustedTotal / 3;
    const newCards: CardType[] = [];

    for (let i = 0; i < uniqueValues; i++) {
      // Create three cards with the same value (a triplet)
      // Start values from 1 to avoid missing icon issue (no 0.svg in cardsets)
      const cardValue = i + 1;

      newCards.push({
        id: i * 3,
        value: cardValue,
        isFlipped: false,
        isMatched: false,
      });

      newCards.push({
        id: i * 3 + 1,
        value: cardValue,
        isFlipped: false,
        isMatched: false,
      });

      newCards.push({
        id: i * 3 + 2,
        value: cardValue,
        isFlipped: false,
        isMatched: false,
      });
    }

    // Shuffle the cards
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }

    return newCards;
  };

  // Start the game from waiting room (host only)
  const startGameFromWaitingRoom = useCallback(() => {
    if (gameMode?.mode === "online" && onlineStatus.isHost) {
      setRoomState(RoomState.PLAYING);
      
      const newCards = generateCards();
      setCards(newCards);
      setFlippedCards([]);
      setMatchedSets([]);
      setGameOver(false);
      setCelebrationCards([]);
      setPlayerScores(activePlayers.map(() => 0));
      setCurrentPlayerIndex(0);
      
      // Start with host as current player
      const firstPlayerId = onlineStatus.players[0] || onlineStatus.localPlayerId;
      setCurrentPlayerId(firstPlayerId);
      setMoves(0);
      
      console.log("Host starting game from waiting room, first player:", firstPlayerId);
      setTimeout(() => {
        broadcastGameState({
          roomState: RoomState.PLAYING,
          cards: newCards,
          flippedCards: [],
          matchedSets: [],
          playerScores: activePlayers.map(() => 0),
          currentPlayerIndex: 0,
          currentPlayerId: firstPlayerId,
          moves: 0,
        });
      }, 50);
    }
  }, [gameMode, onlineStatus.isHost, onlineStatus.players, onlineStatus.localPlayerId, activePlayers, broadcastGameState, generateCards]);

  // Initialize the game with new cards
  const initializeGame = () => {
    const newCards = generateCards();
    setCards(newCards);
    setFlippedCards([]);
    setMatchedSets([]);
    setGameOver(false);
    setCelebrationCards([]);
    setPlayerScores(activePlayers.map(() => 0));
    setCurrentPlayerIndex(0);
    setMoves(0);

    // In online mode, broadcast the initial game state
    if (gameMode?.mode === "online") {
      console.log("Broadcasting initial game state");
      setTimeout(() => {
        broadcastGameState({
          roomState: RoomState.PLAYING,
          cards: newCards,
          flippedCards: [],
          matchedSets: [],
          playerScores: activePlayers.map(() => 0),
          currentPlayerIndex: 0,
          currentPlayerId: onlineStatus.players[0] || onlineStatus.localPlayerId,
          moves: 0,
        });
      }, 50);
    }
  };

  // Reset the game with the current configuration
  const resetGame = useCallback(() => {
    console.log("=== resetGame ===");

    // If in online mode and not the host, don't allow resetting
    if (gameMode?.mode === "online" && !onlineStatus.isHost) {
      return;
    }

    // Reset game state
    const newCards = generateCards();
    setCards(newCards);
    setFlippedCards([]);
    setMatchedSets([]);
    setGameOver(false);
    setCelebrationCards([]);

    // Set player scores based on game mode
    const playerCount = activePlayers.length;

    setPlayerScores(Array(playerCount).fill(0));
    setCurrentPlayerIndex(0);
    setMoves(0);

    // In online mode, broadcast the new game state to all peers
    if (gameMode?.mode === "online") {
      console.log("Broadcasting new game state after reset");
      setTimeout(() => {
        const firstPlayerId = onlineStatus.players[0] || onlineStatus.localPlayerId;
        setCurrentPlayerId(firstPlayerId);
        broadcastGameState({
          cards: newCards,
          flippedCards: [],
          matchedSets: [],
          playerScores: Array(playerCount).fill(0),
          currentPlayerIndex: 0,
          currentPlayerId: firstPlayerId,
          moves: 0,
        });
      }, 50);
    }
  }, [
    activePlayers.length,
    gameMode,
    onlineStatus.players.length,
    broadcastGameState,
    onlineStatus.isHost,
    generateCards,
  ]);

  // Move to the next player's turn
  const moveToNextPlayer = useCallback(() => {
    console.log("=== moveToNextPlayer ===");

    if (gameMode?.mode === "online") {
      // Use player IDs for online mode
      const players = onlineStatus.players;
      if (players.length === 0) {
        console.error("No players available to move to next player");
        return;
      }

      const currentIndex = players.indexOf(currentPlayerId || "");
      const nextIndex = (currentIndex + 1) % players.length;
      const nextPlayerId = players[nextIndex];

      console.log("Moving to next player:", {
        currentPlayerId,
        nextPlayerId,
        currentIndex,
        nextIndex,
        players,
      });

      setCurrentPlayerId(nextPlayerId);
      setCurrentPlayerIndex(nextIndex); // Keep for backwards compatibility
    } else {
      // Local mode - use index-based logic
      const playerCount = activePlayers.length;
      if (playerCount === 0) {
        console.error("No players available to move to next player");
        return;
      }

      const nextPlayerIndex = (currentPlayerIndex + 1) % playerCount;
      setCurrentPlayerIndex(nextPlayerIndex);
    }
  }, [
    gameMode,
    onlineStatus.players,
    currentPlayerId,
    currentPlayerIndex,
    activePlayers.length,
  ]);

  // Handle card click
  const handleCardClick = (id: number) => {
    console.log("=== handleCardClick ===");
    console.log("Card clicked:", id);

    // Ignore clicks if the card is already flipped or matched
    const clickedCard = cards.find((card) => card.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) {
      console.log("Card click rejected: card already flipped or matched");
      return;
    }

    console.log("Current game state:", {
      flippedCards,
      matchedSets,
      currentPlayerIndex,
      onlineStatus: {
        players: onlineStatus.players,
        isHost: onlineStatus.isHost,
        localPlayerId: onlineStatus.localPlayerId,
      },
    });

    // If we already have 3 flipped cards, ignore the click
    if (flippedCards.length === 3) {
      console.log("Card click rejected: already have 3 cards flipped");
      return;
    }

    // If we have 2 flipped cards, check if they match before allowing a third
    if (flippedCards.length === 2) {
      const firstCard = cards.find((card) => card.id === flippedCards[0]);
      const secondCard = cards.find((card) => card.id === flippedCards[1]);

      if (firstCard && secondCard && firstCard.value !== secondCard.value) {
        console.log("Card click rejected: first two cards don't match");
        return;
      }
    }

    // In online mode, validate that it's the local player's turn
    if (gameMode?.mode === "online") {
      // Get the local player ID from onlineStatus
      const localPlayerId = onlineStatus.localPlayerId;

      console.log("Turn validation:", {
        localPlayerId,
        currentPlayerId,
        isMyTurn: localPlayerId === currentPlayerId,
      });

      // Only allow moves if it's the local player's turn
      if (localPlayerId !== currentPlayerId) {
        console.log(
          "Not your turn",
          "Current player:",
          currentPlayerId,
          "Local player:",
          localPlayerId
        );
        return;
      }
      console.log("Turn validated: it is your turn");
    }

    // Flip the card
    setCards(
      cards.map((card) =>
        card.id === id ? { ...card, isFlipped: true } : card
      )
    );

    // Add to flipped cards
    setFlippedCards([...flippedCards, id]);

    // Increment moves only if this is the first card of a new turn
    if (flippedCards.length === 0) {
      setMoves((prevMoves) => prevMoves + 1);
    }

    // In online mode, sync the game state
    if (gameMode?.mode === "online") {
      // Small delay to ensure state updates have been processed
      setTimeout(() => {
        broadcastGameState({
          cards: cards.map((card) =>
            card.id === id ? { ...card, isFlipped: true } : card
          ),
          flippedCards: [...flippedCards, id],
          matchedSets,
          playerScores,
          currentPlayerIndex,
          currentPlayerId,
          moves: flippedCards.length === 0 ? moves + 1 : moves,
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
      const firstCard = cards.find((card) => card.id === flippedCards[0]);
      const secondCard = cards.find((card) => card.id === flippedCards[1]);

      if (firstCard && secondCard) {
        if (firstCard.value !== secondCard.value) {
          // First two cards don't match, end turn after delay
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

            // In online mode, sync the game state
            if (gameMode?.mode === "online") {
              // Calculate next player
              const players = onlineStatus.players;
              const currentIndex = players.indexOf(currentPlayerId || "");
              const nextIndex = (currentIndex + 1) % players.length;
              const nextPlayerId = players[nextIndex];
              
              broadcastGameState({
                cards: cards.map((card) => {
                  if (flippedCards.includes(card.id)) {
                    return { ...card, isFlipped: false };
                  }
                  return card;
                }),
                flippedCards: [],
                matchedSets,
                playerScores,
                currentPlayerIndex: nextIndex,
                currentPlayerId: nextPlayerId,
                moves,
              });
            }
          }, 1500);

          return () => clearTimeout(timer);
        } else {
          // First two cards match! Show toast
          setShowToast(true);
          // Auto-hide toast after 3 seconds
          setTimeout(() => setShowToast(false), 3000);
        }
        // If first two cards match, allow third card flip (continue to 3-card logic below)
      }
    }

    // If we have 3 cards flipped, check if they all match
    if (flippedCards.length === 3) {
      const firstCard = cards.find((card) => card.id === flippedCards[0]);
      const secondCard = cards.find((card) => card.id === flippedCards[1]);
      const thirdCard = cards.find((card) => card.id === flippedCards[2]);

      if (
        firstCard &&
        secondCard &&
        thirdCard &&
        firstCard.value === secondCard.value &&
        secondCard.value === thirdCard.value
      ) {
        // All three cards match! Start animation
        const matchingCardIds = [firstCard.id, secondCard.id, thirdCard.id];
        setAnimatingCards(matchingCardIds);

        // Immediately mark cards as matched (they'll be hidden during animation)
        setCards(
          cards.map((card) =>
            matchingCardIds.includes(card.id)
              ? { ...card, isMatched: true }
              : card
          )
        );

        // Add to matched sets (only once per set)
        let updatedMatchedSets = matchedSets;
        let updatedPlayerScores = playerScores;
        
        if (!matchedSets.includes(firstCard.value)) {
          // Add to matched sets
          updatedMatchedSets = [...matchedSets, firstCard.value];
          setMatchedSets(updatedMatchedSets);

          // Increment score for current player (only once per matched set)
          updatedPlayerScores = playerScores.map((score, idx) =>
            idx === currentPlayerIndex ? score + 1 : score
          );
          setPlayerScores(updatedPlayerScores);
        }

        // Reset flipped cards immediately
        setFlippedCards([]);

        // Clear animation state after animation completes (including max delay + animation time)
        setTimeout(() => {
          setAnimatingCards([]);
        }, 2000); // 1000ms max delay + 800ms animation + 200ms buffer

        // Player gets another turn after a match

        // In online mode, sync the game state
        if (gameMode?.mode === "online") {
          // Small delay to ensure state updates have been processed
          setTimeout(() => {
            broadcastGameState({
              cards: cards.map((card) =>
                matchingCardIds.includes(card.id)
                  ? { ...card, isMatched: true }
                  : card
              ),
              flippedCards: [],
              matchedSets: updatedMatchedSets,
              playerScores: updatedPlayerScores,
              currentPlayerIndex,
              currentPlayerId,
              moves,
            });
          }, 50);
        }
      } else {
        // Not all three cards match, flip them back after a delay
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

          // In online mode, sync the game state
          if (gameMode?.mode === "online") {
            // Calculate next player
            const players = onlineStatus.players;
            const currentIndex = players.indexOf(currentPlayerId || "");
            const nextIndex = (currentIndex + 1) % players.length;
            const nextPlayerId = players[nextIndex];
            
            broadcastGameState({
              cards: cards.map((card) => {
                if (flippedCards.includes(card.id)) {
                  return { ...card, isFlipped: false };
                }
                return card;
              }),
              flippedCards: [],
              matchedSets,
              playerScores,
              currentPlayerIndex: nextIndex,
              currentPlayerId: nextPlayerId,
              moves,
            });
          }
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [
    flippedCards,
    cards,
    matchedSets,
    playerScores,
    currentPlayerIndex,
    activePlayers.length,
    moveToNextPlayer,
    gameMode,
    moves,
    sendGameState,
  ]);

  // Check if the game is over (all cards matched)
  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched) && !gameOver) {
      // Game over!
      console.log("Game over! Final scores:", playerScores);
      setGameOver(true);
      
      // Start celebration animation - make all cards fly around
      const allCardIds = cards.map(card => card.id);
      setCelebrationCards(allCardIds);
      
      // Show modal after a short delay to let animation start
      setTimeout(() => {
        setModalOpened(true);
      }, 1000);
    }
  }, [cards, playerScores, gameOver]);

  // Effect to initialize game when game mode changes
  useEffect(() => {
    if (gameMode) {
      // In online mode, don't initialize immediately - wait for players
      // Player info is now set in the WebRTC service effect above
      if (gameMode.mode !== "online") {
        // For local mode, always initialize
        initializeGame();
      }
    }
  }, [gameMode]);

  // Effect to initialize room state in online mode  
  useEffect(() => {
    if (gameMode?.mode === "online") {
      // Set initial room state to waiting
      setRoomState(RoomState.WAITING);
    }
  }, [gameMode]);

  // Effect to handle late joiners who join a room with a game in progress
  useEffect(() => {
    if (gameMode?.mode === "online" && roomState === RoomState.PLAYING && cards.length === 0 && !onlineStatus.isHost) {
      // This means we received a PLAYING state but have no cards and we're not the host
      // So we're a late joiner to a game in progress
      console.log("Detected late joiner to game in progress");
    }
  }, [gameMode, roomState, cards.length, onlineStatus.isHost]);

  // Reset game is defined above using useCallback

  // Don't render the game board if there's no game mode selected
  if (!gameMode) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="font-bubblegum text-primary mb-4 text-2xl">
            Welcome to Matchlet!
          </h2>
          <p>Select a game mode to start playing</p>
        </div>
      </div>
    );
  }

  // In online mode, handle different room states
  if (gameMode.mode === "online") {
    if (roomState === RoomState.WAITING) {
      return (
        <WaitingRoom
          gameMode={gameMode}
          onlineStatus={onlineStatus}
          localPlayer={activePlayers.find(p => p.id === onlineStatus.localPlayerId) || activePlayers[0] || { name: "Player 1", avatar: "1.svg", id: onlineStatus.localPlayerId || "local" }}
          onStartGame={startGameFromWaitingRoom}
        />
      );
    } else if (roomState === RoomState.PLAYING && cards.length === 0 && !onlineStatus.isHost) {
      // Non-host joined a room with game in progress
      return (
        <GameAlreadyStarted
          roomId={onlineStatus.roomId || ""}
          onBackToMenu={() => onBackToMenu?.()}
        />
      );
    } else if (roomState === RoomState.PLAYING && cards.length === 0) {
      // Game is starting but cards haven't loaded yet
      return (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="font-bubblegum text-primary mb-4 text-2xl">
              Starting game...
            </h2>
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
      {/* Sidebar */}
      <div className="col-span-1">
        <PlayerList
          players={activePlayers}
          playerScores={playerScores}
          currentPlayerIndex={currentPlayerIndex}
          currentPlayerId={currentPlayerId}
          gameMode={gameMode}
          onlineStatus={onlineStatus}
        />

        <GameInfo
          moves={moves}
          gameMode={gameMode}
          onlineStatus={onlineStatus}
        />

        <button
          onClick={resetGame}
          className="btn btn-primary font-bubblegum mt-6 w-full"
        >
          Restart Game
        </button>
      </div>
      <div className="col-span-1 md:col-span-3 lg:col-span-4">
        {/* Main game area */}
        <CardGrid
          cards={cards}
          flippedCards={flippedCards}
          animatingCards={animatingCards}
          celebrationCards={celebrationCards}
          currentPlayerIndex={currentPlayerIndex}
          gridCols={gameConfig.gridCols}
          cardset={gameConfig.cardset}
          onCardClick={handleCardClick}
        />
      </div>

      {/* Toast notification */}
      {showToast && (
        <Toast
          type="success"
          message="Cards match! You can flip a third card now."
          position="bottom-right"
        />
      )}

      {/* Game Over Modal */}
      {modalOpened && gameOver && (
        <div className="modal modal-open">
          <div className="modal-box relative">
            <h3 className="font-bubblegum text-primary text-2xl mb-4">
              🎉 Game Over! 🎉
            </h3>
            
            {/* Winner announcement */}
            <div className="mb-6">
              {(() => {
                // Find the winner (highest score)
                const maxScore = Math.max(...playerScores);
                const winnerIndices = playerScores
                  .map((score, index) => ({ score, index }))
                  .filter(player => player.score === maxScore)
                  .map(player => player.index);
                
                if (winnerIndices.length === 1) {
                  const winnerIndex = winnerIndices[0];
                  const winner = activePlayers[winnerIndex];
                  return (
                    <div className="text-center">
                      <div className="text-xl mb-2">🏆 Winner! 🏆</div>
                      <div className="text-lg font-bold">{winner?.name || `Player ${winnerIndex + 1}`}</div>
                      <div className="text-sm text-base-content/70">Score: {maxScore}</div>
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center">
                      <div className="text-xl mb-2">🤝 It's a Tie! 🤝</div>
                      <div className="text-sm text-base-content/70">Score: {maxScore}</div>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Final scores */}
            <div className="mb-6">
              <h4 className="font-bold mb-2">Final Scores:</h4>
              <div className="space-y-2">
                {activePlayers.map((player, index) => (
                  <div key={player.id || index} className="flex justify-between items-center">
                    <span>{player.name || `Player ${index + 1}`}</span>
                    <span className="badge badge-primary">{playerScores[index] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="modal-action">
              <button 
                className="btn btn-primary font-bubblegum"
                onClick={() => {
                  setModalOpened(false);
                  setGameOver(false);
                  setCelebrationCards([]);
                  resetGame();
                }}
              >
                Play Again
              </button>
              {onBackToMenu && (
                <button 
                  className="btn btn-ghost font-bubblegum"
                  onClick={() => {
                    setModalOpened(false);
                    onBackToMenu();
                  }}
                >
                  Back to Menu
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
