import { useState } from "react";
import { getCardUrl } from "../assets";

const Card = ({
  id,
  value,
  isFlipped,
  isMatched,
  isAnimating,
  isCelebrating,
  currentPlayerIndex,
  onClick,
  disabled,
  cardset = "monsters", // Default cardset
}) => {
  const [imageError, setImageError] = useState(false);

  // Get the image URL from our imported assets
  const cardImageUrl = getCardUrl(cardset, value);

  // Animation styles for matched cards and celebration
  const getAnimationStyles = () => {
    if (isCelebrating) {
      // Celebration animation - cards fly around randomly
      const randomX = ((id * 217) % 800) - 400; // Random X between -400 and 400
      const randomY = ((id * 347) % 600) - 300; // Random Y between -300 and 300
      const randomRotate = ((id * 123) % 720) - 360; // Random rotation
      const randomDelay = (id * 67) % 2000; // Random delay up to 2 seconds
      
      return {
        transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg) scale(0.8)`,
        zIndex: 1000,
        transition: `all 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
        transitionDelay: `${randomDelay}ms`,
        pointerEvents: 'none',
      };
    }
    
    if (!isAnimating) return {};
    
    // Generate a random delay between 0-1000ms based on card id for consistency
    const randomDelay = (id * 137) % 1000; // Using id to make it deterministic but appear random
    
    return {
      transform: `rotate(720deg) scale(0.1)`,
      opacity: 0,
      zIndex: 1000,
      transition: `all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      transitionDelay: `${randomDelay}ms`,
      pointerEvents: 'none', // Prevent interactions during animation
    };
  };

  return (
    <div className="col-span-1 h-full w-full" style={{ perspective: "1000px" }}>
      <div
        className={`aspect-square h-full w-full cursor-pointer transition-all duration-300 ${
          disabled ? "cursor-not-allowed" : ""
        } ${isAnimating || isCelebrating ? "z-50" : ""}`}
        style={{ 
          transformStyle: "preserve-3d",
          ...getAnimationStyles()
        }}
        onClick={() => !disabled && !isFlipped && onClick(id)}
      >
        <div
          className={`absolute inset-0 rounded-lg border-2 transition-all duration-300 ${
            isMatched
              ? "border-success bg-success/10"
              : "border-primary bg-primary/10"
          }`}
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <div className="card-back h-full w-full p-2">
              {/* <div className="bg-primary/30 flex h-full w-full items-center justify-center rounded-md">
                <div className="bg-secondary/30 flex h-3/4 w-3/4 items-center justify-center rounded-full">
                  <div className="bg-accent/30 h-1/2 w-1/2 rounded-full"></div>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        <div
          className={`bg-base-100 absolute inset-0 rounded-lg border-2 transition-all duration-300 ${
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
