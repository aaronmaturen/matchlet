import React from "react";
import Card from "./Card";
import { getGridColsClass } from "../utils/GridHelper";
import { CardType } from "../types/GameTypes";

interface CardGridProps {
  cards: CardType[];
  flippedCards: number[];
  animatingCards: number[];
  celebrationCards: number[];
  currentPlayerIndex: number;
  gridCols: number;
  cardset: string;
  onCardClick: (id: number) => void;
}

const CardGrid: React.FC<CardGridProps> = ({
  cards,
  flippedCards,
  animatingCards,
  celebrationCards,
  currentPlayerIndex,
  gridCols,
  cardset,
  onCardClick,
}) => {
  // Helper function to determine if a card is disabled
  const isCardDisabled = (id: number): boolean => {
    const card = cards.find((card) => card.id === id);
    if (!card) return true; // If card not found, consider it disabled
    return (
      card.isMatched ||
      flippedCards.length === 3 || // Only allow up to 3 cards to be flipped at once
      flippedCards.includes(id) // Prevent clicking the same card twice
    );
  };

  return (
    <>
      <div className={`grid gap-4 ${getGridColsClass(gridCols)}`}>
        {cards.map((card) => {
          // Hide matched cards unless they're animating or celebrating
          if (card.isMatched && !animatingCards.includes(card.id) && !celebrationCards.includes(card.id)) {
            return (
              <div key={card.id} className="col-span-1 h-full w-full aspect-square" />
            );
          }
          
          return (
            <Card
              key={card.id}
              id={card.id}
              value={card.value}
              isFlipped={card.isFlipped}
              isMatched={card.isMatched}
              isAnimating={animatingCards.includes(card.id)}
              isCelebrating={celebrationCards.includes(card.id)}
              currentPlayerIndex={currentPlayerIndex}
              onClick={onCardClick}
              disabled={isCardDisabled(card.id)}
              cardset={cardset}
            />
          );
        })}
      </div>
    </>
  );
};

export default CardGrid;
