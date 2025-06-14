import React, { useState, useEffect, useCallback } from "react";
import GameSetupModal from "./GameSetupModal";
import PlayerList from "./PlayerList";
import GameInfo from "./GameInfo";
import CardGrid from "./CardGrid";
import useWebRTC from "../hooks/useWebRTC";
import { CardType, GameConfigType, GameModeType } from "../types/GameTypes";
import { GameState } from "../types/WebRTCTypes";

interface GameProps {
  triggerReset: boolean;
  onResetComplete: () => void;
  gameMode?: GameModeType;
}

const Game: React.FC<GameProps> = ({ triggerReset, onResetComplete, gameMode }) => {
  // Game state
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedSets, setMatchedSets] = useState<number[]>([]);
  const [canFlipThird, setCanFlipThird] = useState(false);
  const [playerScores, setPlayerScores] = useState<number[]>([0]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [modalOpened, setModalOpened] = useState<boolean>(true);
  const [gameConfig, setGameConfig] = useState<GameConfigType>({
    boardSize: "md",
    gridCols: 6,
    gridRows: 3,
    players: [
      {
        name: "Player 1",
        color: "#FF5733",
        avatar: "1.svg",
      },
    ],
    cardset: "animals", // Default cardset
  });

  // Game state update handler for WebRTC
  const handleGameStateUpdate = useCallback((state: GameState) => {
    if (state.cards) setCards(state.cards);
    if (state.flippedCards) setFlippedCards(state.flippedCards);
    if (state.matchedSets) setMatchedSets(state.matchedSets);
    if (state.playerScores) setPlayerScores(state.playerScores);
    if (state.currentPlayerIndex !== undefined)
      setCurrentPlayerIndex(state.currentPlayerIndex);
    if (state.moves !== undefined) setMoves(state.moves);
  }, []);

  // Initialize WebRTC hook
  const { onlineStatus, sendGameState } = useWebRTC({
    gameMode,
    onGameStateUpdate: handleGameStateUpdate,
  });

  // Initialize game when component mounts or when reset is triggered
  useEffect(() => {
    if (triggerReset) {
      resetGame();
      onResetComplete();
    }
  }, [triggerReset, onResetComplete]);

  // Generate cards for the game
  const generateCards = () => {
    // Get grid size from game config
    const { gridCols, gridRows } = gameConfig;
    const totalCards = gridCols * gridRows;
    
    // Ensure we have an even number of cards
    const adjustedTotal = totalCards % 2 === 0 ? totalCards : totalCards - 1;
    
    // Create pairs of cards
    const pairs = adjustedTotal / 2;
    const newCards: CardType[] = [];
    
    for (let i = 0; i < pairs; i++) {
      // Create two cards with the same value (a pair)
      newCards.push({
        id: i * 2,
        value: i,
        isFlipped: false,
        isMatched: false,
      });
      
      newCards.push({
        id: i * 2 + 1,
        value: i,
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

  // Initialize the game with new cards
  const initializeGame = () => {
    const newCards = generateCards();
    setCards(newCards);
    setFlippedCards([]);
    setMatchedSets([]);
    setCanFlipThird(false);
    setPlayerScores(gameConfig.players.map(() => 0));
    setCurrentPlayerIndex(0);
    setMoves(0);
  };

  // Move to the next player's turn
  const moveToNextPlayer = useCallback(() => {
    setCurrentPlayerIndex(
      (prevIndex) => (prevIndex + 1) % gameConfig.players.length
    );
  }, [gameConfig.players.length]);

  // Handle card click
  const handleCardClick = (id: number) => {
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

    // Increment moves only if this is the first card of a new turn
    if (flippedCards.length === 0) {
      setMoves((prevMoves) => prevMoves + 1);
    }

    // In online mode, sync the game state
    if (gameMode?.mode === "online") {
      // Small delay to ensure state updates have been processed
      setTimeout(() => {
        sendGameState({
          cards: cards.map((card) =>
            card.id === id ? { ...card, isFlipped: true } : card
          ),
          flippedCards: [...flippedCards, id],
          matchedSets,
          playerScores,
          currentPlayerIndex,
          moves:
            flippedCards.length === 0
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
      const firstCard = cards.find((card) => card.id === flippedCards[0]);
      const secondCard = cards.find((card) => card.id === flippedCards[1]);

      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        // Cards match! Mark them as matched
        setCards(
          cards.map((card) =>
            card.id === firstCard.id || card.id === secondCard.id
              ? { ...card, isMatched: true }
              : card
          )
        );

        // Add to matched sets
        setMatchedSets([...matchedSets, firstCard.value]);

        // Increment score for current player
        setPlayerScores((prevScores) => {
          const newScores = [...prevScores];
          newScores[currentPlayerIndex] += 1;
          return newScores;
        });

        // Allow flipping a third card as a bonus
        setCanFlipThird(true);

        // In online mode, sync the game state
        if (gameMode?.mode === "online") {
          // Small delay to ensure state updates have been processed
          setTimeout(() => {
            sendGameState({
              cards: cards.map((card) =>
                card.id === firstCard.id || card.id === secondCard.id
                  ? { ...card, isMatched: true }
                  : card
              ),
              flippedCards,
              matchedSets: [...matchedSets, firstCard.value],
              playerScores: playerScores.map((score, idx) =>
                idx === currentPlayerIndex ? score + 1 : score
              ),
              currentPlayerIndex,
              moves,
            });
          }, 50);
        }
      } else {
        // Cards don't match, flip them back after a delay
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
            sendGameState({
              cards: cards.map((card) => {
                if (flippedCards.includes(card.id)) {
                  return { ...card, isFlipped: false };
                }
                return card;
              }),
              flippedCards: [],
              matchedSets,
              playerScores,
              currentPlayerIndex:
                (currentPlayerIndex + 1) % gameConfig.players.length,
              moves,
            });
          }
        }, 1500);

        return () => clearTimeout(timer);
      }
    }

    // If we have 3 cards flipped, flip them all back after a delay
    if (flippedCards.length === 3) {
      const timer = setTimeout(() => {
        setCards(
          cards.map((card) => {
            if (flippedCards.includes(card.id) && !card.isMatched) {
              return { ...card, isFlipped: false };
            }
            return card;
          })
        );
        setFlippedCards([]);
        setCanFlipThird(false);
        moveToNextPlayer();

        // In online mode, sync the game state
        if (gameMode?.mode === "online") {
          sendGameState({
            cards: cards.map((card) => {
              if (flippedCards.includes(card.id) && !card.isMatched) {
                return { ...card, isFlipped: false };
              }
              return card;
            }),
            flippedCards: [],
            matchedSets,
            playerScores,
            currentPlayerIndex:
              (currentPlayerIndex + 1) % gameConfig.players.length,
            moves,
          });
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    flippedCards,
    cards,
    matchedSets,
    playerScores,
    currentPlayerIndex,
    gameConfig.players.length,
    moveToNextPlayer,
    gameMode,
    moves,
    sendGameState,
  ]);

  // Check if the game is over (all cards matched)
  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      // Game over!
      console.log("Game over! Final scores:", playerScores);
    }
  }, [cards, playerScores]);

  // Handle game start from the GameSetupModal
  const handleStartGame = (config: GameConfigType) => {
    setGameConfig(config);
    setModalOpened(false);
    initializeGame();

    // If in online mode, sync the initial game state
    if (gameMode?.mode === "online") {
      // Small delay to ensure state updates have been processed
      setTimeout(() => {
        const newCards = generateCards();
        sendGameState({
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

  // Reset the game
  const resetGame = () => {
    // If in online mode and not the host, don't allow resetting
    if (gameMode?.mode === "online" && !gameMode.isHost) {
      return;
    }

    // Reset game state
    setCards([]);
    setFlippedCards([]);
    setMatchedSets([]);
    setPlayerScores(gameConfig.players.map(() => 0));
    setCurrentPlayerIndex(0);
    setMoves(0);
    setModalOpened(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <PlayerList 
            players={gameConfig.players}
            playerScores={playerScores}
            currentPlayerIndex={currentPlayerIndex}
          />

          <GameInfo 
            moves={moves}
            gameMode={gameMode}
            onlineStatus={onlineStatus}
          />
        </div>

        {/* Main game area */}
        <CardGrid 
          cards={cards}
          flippedCards={flippedCards}
          canFlipThird={canFlipThird}
          gridCols={gameConfig.gridCols}
          cardset={gameConfig.cardset}
          onCardClick={handleCardClick}
        />
      </div>

      {/* Game Setup Modal */}
      <GameSetupModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onStartGame={handleStartGame}
      />
    </div>
  );
};

export default Game;
