import React from "react";
import { PlayerType } from "../types/GameTypes";
import PlayerRow from "./PlayerRow";

interface WaitingRoomProps {
  gameMode: {
    mode: string;
    roomId?: string;
    isHost?: boolean;
  };
  onlineStatus: {
    connected: boolean;
    roomId: string | null;
    isHost: boolean;
    players: string[];
    playersInfo: Record<string, { name: string; avatar: string }>;
    localPlayerId?: string;
    error: string | null;
  };
  localPlayer: PlayerType;
  onStartGame: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  gameMode,
  onlineStatus,
  localPlayer,
  onStartGame,
}) => {
  // Create a list of all players (local + remote) - deduplicated
  const allPlayers = React.useMemo(() => {
    console.log("🔥 WaitingRoom: Computing allPlayers");
    console.log("🔥 WaitingRoom: onlineStatus.localPlayerId:", onlineStatus.localPlayerId);
    console.log("🔥 WaitingRoom: onlineStatus.players:", onlineStatus.players);
    console.log("🔥 WaitingRoom: onlineStatus.playersInfo:", onlineStatus.playersInfo);
    
    const players = [
      // Local player first
      {
        id: onlineStatus.localPlayerId || 'local',
        name: localPlayer.name,
        avatar: localPlayer.avatar,
        isLocal: true,
        isHost: onlineStatus.isHost,
      }
    ];

    // Add remote players - filter out duplicates and local player
    const uniqueRemotePlayers = onlineStatus.players
      .filter(playerId => {
        const isNotLocal = playerId !== onlineStatus.localPlayerId;
        console.log(`🔥 WaitingRoom: Player ${playerId} isNotLocal: ${isNotLocal}`);
        return isNotLocal;
      })
      .filter((playerId, index, array) => array.indexOf(playerId) === index) // Remove duplicates
      .map((playerId) => {
        const playerInfo = onlineStatus.playersInfo?.[playerId];
        console.log(`🔥 WaitingRoom: Remote player ${playerId} info:`, playerInfo);
        return {
          id: playerId,
          name: playerInfo?.name || `Player ${playerId.slice(-4)}`,
          avatar: playerInfo?.avatar || "1.svg",
          isLocal: false,
          isHost: false,
        };
      });

    console.log("🔥 WaitingRoom: Final allPlayers:", [...players, ...uniqueRemotePlayers]);
    return [...players, ...uniqueRemotePlayers];
  }, [onlineStatus.localPlayerId, onlineStatus.players, onlineStatus.playersInfo, onlineStatus.isHost, localPlayer.name, localPlayer.avatar]);

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="font-bubblegum text-primary mb-2 text-3xl">
            Waiting Room
          </h2>
          <div className="badge badge-outline mb-4">
            Room: {onlineStatus.roomId}
          </div>
          <p className="text-sm text-base-content/70">
            {onlineStatus.isHost 
              ? "Waiting for players to join..." 
              : "Waiting for host to start the game..."}
          </p>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bubblegum text-lg">
                Players ({allPlayers.length})
              </h3>
              <div className={`badge ${onlineStatus.connected ? 'badge-success' : 'badge-error'}`}>
                {onlineStatus.connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            <div className="space-y-3">
              {allPlayers.map((player, index) => (
                <PlayerRow
                  key={`${player.id}-${index}`}
                  name={player.name}
                  avatar={player.avatar}
                  score={0}
                  isCurrentPlayer={false}
                  isLocal={player.isLocal}
                  isHost={player.isHost}
                />
              ))}
            </div>

            {allPlayers.length < 2 && (
              <div className="alert alert-info mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Need at least 2 players to start the game</span>
              </div>
            )}

            {onlineStatus.error && (
              <div className="alert alert-error mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{onlineStatus.error}</span>
              </div>
            )}

            {onlineStatus.isHost && (
              <div className="card-actions justify-end mt-6">
                <button
                  className="btn btn-primary font-bubblegum"
                  disabled={allPlayers.length < 2}
                  onClick={onStartGame}
                >
                  Start Game
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;