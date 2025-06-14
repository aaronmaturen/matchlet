import React from 'react';
import Card from './Card';
import { CardType } from '../types/GameTypes';

interface CardGridProps {
  cards: CardType[];
  flippedCards: number[];
  canFlipThird: boolean;
  gridCols: number;
  cardset: string;
  onCardClick: (id: number) => void;
}

const CardGrid: React.FC<CardGridProps> = ({
  cards,
  flippedCards,
  canFlipThird,
  gridCols,
  cardset,
  onCardClick
}) => {
  // Helper function to determine if a card is disabled
  const isCardDisabled = (id: number): boolean => {
    const card = cards.find((card) => card.id === id);
    if (!card) return true; // If card not found, consider it disabled
    return (
      card.isMatched ||
      flippedCards.length === 3 ||
      (flippedCards.length === 2 && !canFlipThird)
    );
  };

  // Helper function to get the grid columns class based on grid size with responsive breakpoints
  const getGridColsClass = (cols: number): string => {
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

  return (
    <div className="bg-base-200/50 h-full overflow-y-auto rounded-lg p-4 shadow-inner md:col-span-3 lg:col-span-4">
      <div
        className={`grid gap-4 ${getGridColsClass(gridCols)} w-full auto-rows-min pb-4`}
      >
        {cards.map((card) => (
          <Card
            key={card.id}
            id={card.id}
            value={card.value}
            isFlipped={card.isFlipped}
            isMatched={card.isMatched}
            onClick={onCardClick}
            disabled={isCardDisabled(card.id)}
            cardset={cardset}
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
    </div>
  );
};

export default CardGrid;
