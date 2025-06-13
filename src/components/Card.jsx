import "./Card.css";

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
  // Get the image path for the card value
  const getCardImagePath = (value) => {
    // Get all available monster images from the public directory
    // In a real app, we would fetch this list from an API or context
    // For now, we'll use the value as an index to select an image
    const imagePath = `${import.meta.env.BASE_URL}cardsets/${cardset}/${value}.svg`;
    return imagePath;
  };

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
            {/* Display image instead of number */}
            <img 
              src={getCardImagePath(value)} 
              alt={`Card ${value}`} 
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                // Fallback to displaying the number if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="font-mono text-lg hidden">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
