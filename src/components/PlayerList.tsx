import React from "react";
import { PlayerType } from "../types/GameTypes";
import PlayerRow from "./PlayerRow";

interface PlayerListProps {
  players: PlayerType[];
  playerScores: number[];
  currentPlayerIndex: number;
  currentPlayerId?: string | null;
  gameMode?: {
    mode: string;
    isHost?: boolean;
  };
  onlineStatus?: {
    isHost: boolean;
    localPlayerId?: string;
    players?: string[];
  };
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  playerScores,
  currentPlayerIndex,
  currentPlayerId,
  gameMode,
  onlineStatus,
}) => {
  return (
    <div>
      <h2 className="font-bubblegum text-primary mb-4 text-xl">Players</h2>
      <div className="space-y-4">
        {players.map((player, index) => {
          let isCurrentPlayer = false;
          let isLocalPlayer = false;
          let isHost = false;

          if (gameMode?.mode === "online") {
            // In online mode, use player IDs for turn indication
            isCurrentPlayer = currentPlayerId === player.id;
            isLocalPlayer = player.id === onlineStatus?.localPlayerId;
            isHost = isLocalPlayer && onlineStatus?.isHost;
            
          } else {
            // In local mode, use index-based logic
            isCurrentPlayer = currentPlayerIndex === index;
            isLocalPlayer = false;
            isHost = false;
          }
          
          return (
            <PlayerRow
              key={player.id || index}
              name={player.name}
              avatar={player.avatar}
              score={playerScores[index]}
              isCurrentPlayer={isCurrentPlayer}
              isLocal={isLocalPlayer}
              isHost={isHost}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PlayerList;
