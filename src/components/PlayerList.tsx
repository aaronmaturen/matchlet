import React from 'react';
import { getAvatarUrl } from "../assets";
import { PlayerType } from '../types/GameTypes';

interface PlayerListProps {
  players: PlayerType[];
  playerScores: number[];
  currentPlayerIndex: number;
}

const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  playerScores, 
  currentPlayerIndex 
}) => {
  return (
    <div>
      <h2 className="font-bubblegum text-primary mb-4 text-xl">
        Players
      </h2>
      <div className="space-y-4">
        {players.map((player, index) => (
          <div
            key={index}
            className={`flex items-center justify-between rounded-lg p-3 ${currentPlayerIndex === index ? "bg-base-300 shadow-md" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div
                  className={`ring-primary ring-offset-base-100 w-12 rounded-full ring ring-offset-2 ${currentPlayerIndex === index ? "tw-avatar-ping" : ""}`}
                >
                  <img
                    src={
                      getAvatarUrl(player.avatar) ||
                      `${import.meta.env.BASE_URL || "/"}avatars/${player.avatar}`
                    }
                    alt={`${player.name}'s avatar`}
                  />
                </div>
              </div>
              <div>
                <p className="font-schoolbell text-lg">{player.name}</p>
                <p className="text-sm">
                  Score:{" "}
                  <span className="font-bold">{playerScores[index]}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
