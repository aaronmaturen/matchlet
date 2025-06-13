import "./Card.css";
import { useState } from "react";
import { getCardUrl } from "../assets";

const Card = ({
  id,
  value,
  isFlipped,
  isMatched,
  onClick,
  disabled,
  cardset = "monsters", // Default cardset
}) => {
  const [imageError, setImageError] = useState(false);

  // Get the image URL from our imported assets
  const cardImageUrl = getCardUrl(cardset, value);

  return (
    <div className="perspective-1000 h-full w-full">
      <div
        className={`transform-style-3d aspect-square h-full w-full cursor-pointer transition-all duration-300 ${
          disabled ? "cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && !isFlipped && onClick(id)}
      >
        <div
          className={`absolute inset-0 transition-all duration-300 backface-hidden ${isFlipped ? "rotate-y-180" : ""} rounded-lg border-2 ${isMatched ? "border-success bg-success/10" : "border-primary bg-primary/10"}`}
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-full w-full p-2">
              <div className="bg-primary/30 flex h-full w-full items-center justify-center rounded-md">
                <div className="bg-secondary/30 flex h-3/4 w-3/4 items-center justify-center rounded-full">
                  <div className="bg-accent/30 h-1/2 w-1/2 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 rotate-y-180 transition-all duration-300 backface-hidden ${
            isFlipped ? "" : "rotate-y-0"
          } bg-base-100 rounded-lg border-2 ${
            isMatched ? "border-success bg-success/10" : "border-primary"
          }`}
          style={{
            transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex h-full w-full items-center justify-center p-2">
            {/* Display image or fallback based on availability */}
            {cardImageUrl && !imageError ? (
              <img
                src={cardImageUrl}
                alt={`Card ${value}`}
                className="max-h-full max-w-full object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="font-mono text-lg">{value}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
