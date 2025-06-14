import { useState, useEffect, useRef, useCallback } from 'react';
import WebRTCService from '../services/WebRTCService';
import { ConnectionStatus, GameState } from '../types/WebRTCTypes';
import { OnlineStatusType } from '../types/GameTypes';

interface UseWebRTCProps {
  gameMode?: {
    mode: string;
    roomId?: string;
    isHost?: boolean;
  };
  onGameStateUpdate: (state: GameState) => void;
}

export const useWebRTC = ({ gameMode, onGameStateUpdate }: UseWebRTCProps) => {
  const webRTCServiceRef = useRef<WebRTCService | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusType>({
    connected: false,
    roomId: null,
    isHost: false,
    players: [],
    error: null,
  });

  const onPlayerJoined = useCallback((userId: string) => {
    setOnlineStatus((prev) => ({
      ...prev,
      players: [...prev.players, userId],
    }));
  }, []);

  const onPlayerLeft = useCallback((userId: string) => {
    setOnlineStatus((prev) => ({
      ...prev,
      players: prev.players.filter((id) => id !== userId),
    }));
  }, []);

  const onConnectionStatusChange = useCallback((status: ConnectionStatus) => {
    console.log("Connection status changed:", status);
    setOnlineStatus((prev) => ({
      ...prev,
      connected: status.connected,
      error: status.error,
      connectionStatus: status,
    }));
  }, []);

  const sendGameState = useCallback((state: GameState) => {
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.sendGameState(state);
    }
  }, []);

  useEffect(() => {
    if (gameMode?.mode === "online" && gameMode?.roomId) {
      // Create WebRTC service if it doesn't exist
      if (!webRTCServiceRef.current) {
        webRTCServiceRef.current = new WebRTCService();
      }

      // Set up event handlers
      if (webRTCServiceRef.current) {
        // Add player joined/left handlers
        webRTCServiceRef.current.onPlayerJoined = onPlayerJoined;
        webRTCServiceRef.current.onPlayerLeft = onPlayerLeft;
        webRTCServiceRef.current.onGameStateUpdate = onGameStateUpdate;
        
        // Add connection status change handler
        webRTCServiceRef.current.onConnectionStatusChange = onConnectionStatusChange;
        
        // Connect to signaling server
        try {
          // Use the signaling server URL from environment variables
          const serverUrl = import.meta.env.VITE_SIGNALING_URL || "https://matchlet-signaling.onrender.com";
          
          // Get local user ID from WebRTC service
          const localUserId = webRTCServiceRef.current.connect(
            serverUrl,
            gameMode.roomId,
            !!gameMode.isHost
          );

          setOnlineStatus({
            connected: true,
            roomId: gameMode.roomId || null,
            isHost: !!gameMode.isHost,
            players: [localUserId],
            error: null,
            connectionStatus: webRTCServiceRef.current.getConnectionStatus(),
          });
        } catch (error) {
          console.error("Failed to connect to signaling server:", error);
          setOnlineStatus((prev) => ({
            ...prev,
            error: "Failed to connect to signaling server",
          }));
        }
      }
    }

    // Cleanup function
    return () => {
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.disconnect();
      }
    };
  }, [gameMode, onGameStateUpdate, onPlayerJoined, onPlayerLeft, onConnectionStatusChange]);

  return {
    onlineStatus,
    sendGameState,
    webRTCService: webRTCServiceRef.current
  };
};

export default useWebRTC;
