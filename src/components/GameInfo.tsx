import React from 'react';
import ConnectionStatus from './ConnectionStatus';
import { OnlineStatusType } from '../types/GameTypes';

interface GameInfoProps {
  moves: number;
  gameMode?: {
    mode: string;
  };
  onlineStatus: OnlineStatusType;
}

const GameInfo: React.FC<GameInfoProps> = ({ moves, gameMode, onlineStatus }) => {
  return (
    <div className="bg-base-200 mt-6 rounded-lg p-4 shadow-md">
      <h2 className="font-bubblegum text-primary mb-4 text-xl">
        Game Info
      </h2>
      <div className="space-y-2">
        <p className="font-comic text-lg">
          Moves: <span className="font-bold">{moves}</span>
        </p>
        
        {/* Connection Status UI */}
        {gameMode?.mode === "online" && (
          <ConnectionStatus 
            connectionStatus={onlineStatus.connectionStatus}
            roomId={onlineStatus.roomId}
            error={onlineStatus.error}
          />
        )}
      </div>
    </div>
  );
};

export default GameInfo;
