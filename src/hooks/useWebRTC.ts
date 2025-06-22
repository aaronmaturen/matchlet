import { useState, useEffect, useRef, useCallback } from 'react';
import WebRTCService from '../services/WebRTCService';
import { ConnectionStatus, GameState, RoomState } from '../types/WebRTCTypes';
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
  // Always maintain the same order of hooks
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusType>({
    connected: false,
    roomId: null,
    isHost: false,
    players: [],
    error: null,
    roomState: RoomState.WAITING,
  });
  
  // Refs after useState
  const webRTCServiceRef = useRef<WebRTCService | null>(null);
  const isInitialMount = useRef(true);

  // These callback functions are memoized and don't depend on any props or state
  // so they won't be recreated on each render
  const onPlayerJoined = useCallback((userId: string) => {
    console.log("🔥 onPlayerJoined called with userId:", userId);
    setOnlineStatus((prev) => {
      console.log("🔥 Current players before adding:", prev.players);
      console.log("🔥 Local player ID:", prev.localPlayerId);
      
      // Don't add the player if they're already in the list
      if (prev.players.includes(userId)) {
        console.log("🔥 Player already in list, not adding again");
        return prev;
      }
      
      const newPlayers = [...prev.players, userId];
      console.log("🔥 New players after adding:", newPlayers);
      return {
        ...prev,
        players: newPlayers,
      };
    });
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

  const onPlayerInfoUpdate = useCallback((userId: string, playerInfo: { name: string; avatar: string }) => {
    console.log("🔥 useWebRTC: onPlayerInfoUpdate called for userId:", userId, "playerInfo:", playerInfo);
    setOnlineStatus((prev) => {
      console.log("🔥 useWebRTC: Current playersInfo before update:", prev.playersInfo);
      const newPlayersInfo = {
        ...prev.playersInfo,
        [userId]: playerInfo,
      };
      console.log("🔥 useWebRTC: New playersInfo after update:", newPlayersInfo);
      return {
        ...prev,
        playersInfo: newPlayersInfo,
      };
    });
  }, []);

  const sendGameState = useCallback((state: GameState) => {
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.sendGameState(state);
    }
  }, []);

  // Expose isDataChannelOpen function
  const isDataChannelOpen = useCallback(() => {
    return webRTCServiceRef.current?.isDataChannelOpen() || false;
  }, []);

  // Expose the WebRTCService instance
  const getWebRTCService = useCallback(() => {
    return webRTCServiceRef.current;
  }, []);

  // Player order and info are now managed automatically by WebRTC events


  useEffect(() => {
    // Only run connection logic on initial mount or when gameMode actually changes
    if (gameMode?.mode === "online" && gameMode?.roomId) {
      // Prevent multiple connections to the same room
      if (webRTCServiceRef.current && 
          onlineStatus.roomId === gameMode.roomId && 
          onlineStatus.connected) {
        console.log("Already connected to room", gameMode.roomId);
        return;
      }

      // Disconnect from previous room if exists
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.disconnect();
      }

      // Create new WebRTC service
      webRTCServiceRef.current = new WebRTCService();

      // Set up event handlers
      if (webRTCServiceRef.current) {
        console.log("🔥 useWebRTC: Setting up event handlers");
        // Add player joined/left handlers
        webRTCServiceRef.current.onPlayerJoined = onPlayerJoined;
        webRTCServiceRef.current.onPlayerLeft = onPlayerLeft;
        webRTCServiceRef.current.onGameStateUpdate = onGameStateUpdate;
        console.log("🔥 useWebRTC: onPlayerJoined callback set:", !!webRTCServiceRef.current.onPlayerJoined);
        
        // Add connection status change handler
        webRTCServiceRef.current.onConnectionStatusChange = onConnectionStatusChange;
        
        // Add player info update handler
        webRTCServiceRef.current.onPlayerInfoUpdate = onPlayerInfoUpdate;
        
        // Add connection established handler
        webRTCServiceRef.current.onConnectionEstablished = (userId: string) => {
          console.log("Connection established with:", userId);
          // Player info is already sent when data channel opens, no need to broadcast again
        };
        
        // Connect to signaling server
        try {
          // Use the signaling server URL from environment variables
          const serverUrl = import.meta.env.VITE_SIGNALING_URL || "https://matchlet-signaling.onrender.com";
          
          console.log("Connecting to signaling server:", serverUrl, "room:", gameMode.roomId);
          
          // Get local user ID from WebRTC service
          const localUserId = webRTCServiceRef.current.connect(
            serverUrl,
            gameMode.roomId,
            !!gameMode.isHost
          );

          console.log("🔥 useWebRTC: Setting initial online status with localUserId:", localUserId);
          setOnlineStatus({
            connected: true,
            roomId: gameMode.roomId || null,
            isHost: !!gameMode.isHost,
            players: [localUserId],
            error: null,
            connectionStatus: webRTCServiceRef.current.getConnectionStatus(),
            localPlayerId: localUserId, // Store local player ID for consistent reference
            playersInfo: {},
            roomState: RoomState.WAITING,
          });
          console.log("🔥 useWebRTC: Initial players array:", [localUserId]);
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
      // Only disconnect when component unmounts or gameMode changes to non-online
      if (gameMode?.mode !== "online" && webRTCServiceRef.current) {
        console.log("Disconnecting from signaling server");
        webRTCServiceRef.current.disconnect();
        webRTCServiceRef.current = null;
      }
    };
  // Only depend on the specific gameMode properties we care about
  }, [gameMode?.mode, gameMode?.roomId, gameMode?.isHost]);

  return {
    onlineStatus,
    sendGameState,
    isDataChannelOpen,
    getWebRTCService,
    webRTCService: webRTCServiceRef.current
  };
};

export default useWebRTC;
