import React from "react";

interface GameAlreadyStartedProps {
  roomId: string;
  onBackToMenu: () => void;
}

const GameAlreadyStarted: React.FC<GameAlreadyStartedProps> = ({
  roomId,
  onBackToMenu,
}) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body text-center">
            <div className="mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-16 w-16 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h2 className="font-bubblegum text-primary mb-2 text-2xl">
              Game Already Started
            </h2>
            
            <div className="badge badge-outline mb-4">
              Room: {roomId}
            </div>
            
            <p className="mb-6 text-base-content/70">
              This room already has a game in progress. You cannot join a game that has already started.
            </p>
            
            <div className="card-actions justify-center">
              <button
                className="btn btn-primary font-bubblegum"
                onClick={onBackToMenu}
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameAlreadyStarted;