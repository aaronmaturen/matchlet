import "./Card.css";
import { useState, useEffect, useCallback } from "react";

const Card = ({
  id,
  value,
  isFlipped,
  isMatched,
  onClick,
  disabled,
  isPotentialMatch,
  cardset = "monsters", // Default cardset
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get the image path for the card value with useCallback to avoid dependency changes
  const getCardImagePath = useCallback((val) => {
    return `${import.meta.env.BASE_URL}cardsets/${cardset}/${val}.svg`;
  }, [cardset]);
  
  // Preload the image
  useEffect(() => {
    // Reset states when value or cardset changes
    setImageLoaded(false);
    setImageError(false);
    
    const img = new Image();
    const src = getCardImagePath(value);
    img.src = src;
    
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      setImageError(true);
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [value, getCardImagePath]);

  return (
    <div className="perspective-1000 h-full w-full">
      <div
        className={`transform-style-3d aspect-square h-full w-full cursor-pointer transition-all duration-300 ${
          disabled ? "cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && !isFlipped && onClick(id)}
      >
        <div
          className={`absolute inset-0 transition-all duration-300 backface-hidden ${isFlipped ? "rotate-y-180" : ""} rounded-lg border-2 ${isPotentialMatch ? "border-accent shadow-accent/40 shadow-lg" : ""} ${isMatched ? "border-success bg-success/10" : "border-primary bg-primary/10"}`}
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-full w-full p-2">
              <div className="h-full w-full rounded-md bg-primary/30 flex items-center justify-center">
                <div className="h-3/4 w-3/4 rounded-full bg-secondary/30 flex items-center justify-center">
                  <div className="h-1/2 w-1/2 rounded-full bg-accent/30"></div>
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
            {/* Display image or fallback based on loading state */}
            {!imageError ? (
              <img 
                src={getCardImagePath(value)} 
                alt={`Card ${value}`} 
                className={`max-h-full max-w-full object-contain ${imageLoaded ? '' : 'opacity-0'}`}
                style={{ transition: 'opacity 0.2s ease-in' }}
                onLoad={() => setImageLoaded(true)}
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
