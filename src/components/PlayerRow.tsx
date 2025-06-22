import React from "react";
import { getAvatarUrl } from "../assets";

interface PlayerRowProps {
  name: string;
  avatar: string;
  score: number;
  isCurrentPlayer: boolean;
  isLocal?: boolean;
  isHost?: boolean;
}

const PlayerRow: React.FC<PlayerRowProps> = ({
  name,
  avatar,
  score,
  isCurrentPlayer,
  isLocal = false,
  isHost = false,
}) => {
  return (
    <div
      className={`flex items-center justify-between rounded-lg p-3 ${isCurrentPlayer ? "bg-base-300 shadow-md" : ""}`}
    >
      <span className="relative flex size-12">
        {isCurrentPlayer && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
        )}
        <img
          src={getAvatarUrl(avatar)}
          alt={`${name}'s avatar`}
          className="relative inline-flex size-12 rounded-full bg-sky-500"
        />
      </span>
      <div>
        <div className="font-comic text-sm flex items-center gap-1">
          {name}
          {isHost && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-yellow-500"
              title="Host"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
          {isLocal ? " (You)" : ""}
        </div>
        <div className="text-xs">Score: {score}</div>
      </div>
    </div>
  );
};

export default PlayerRow;
