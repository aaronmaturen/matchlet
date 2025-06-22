/**
 * WebRTC Signaling Server Types
 * For use with the Matchlet WebRTC Signaling Server at https://matchlet-signaling.onrender.com
 */

/**
 * Connection status information
 */
export interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempt: number;
  lastConnected: string | null;
}

/**
 * Room state enum
 */
export enum RoomState {
  WAITING = "waiting",
  PLAYING = "playing",
  FINISHED = "finished"
}

/**
 * Game state that can be synchronized between peers
 */
export interface GameState {
  roomState?: RoomState;
  cards?: Array<{
    id: number;
    value: number;
    isFlipped: boolean;
    isMatched: boolean;
  }>;
  flippedCards?: number[];
  matchedSets?: number[];
  playerScores?: number[];
  currentPlayerIndex?: number; // Keep for backwards compatibility
  currentPlayerId?: string; // New player ID-based turn system
  moves?: number;
  playerOrder?: string[];
}

/**
 * Configuration for RTCPeerConnection
 */
export interface RTCConfiguration {
  iceServers: RTCIceServer[];
}

/**
 * WebRTC Service interface
 */
export interface IWebRTCService {
  /**
   * Connect to the signaling server
   * @param serverUrl URL of the signaling server
   * @param roomId Room ID to join
   * @param isHost Whether this client is the host
   * @returns Local user ID
   */
  connect(serverUrl: string, roomId: string, isHost: boolean): string;

  /**
   * Disconnect from the signaling server and close all peer connections
   */
  disconnect(): void;

  /**
   * Send game state to all connected peers
   * @param state Game state to send
   */
  sendGameState(state: GameState): void;

  /**
   * Get current connection status
   * @returns Current connection status
   */
  getConnectionStatus(): ConnectionStatus;
  
  /**
   * Check if any data channel is open for communication
   * @returns Boolean indicating if at least one data channel is open
   */
  isDataChannelOpen(): boolean;
  
  /**
   * Request game state from the host
   */
  requestGameState(): void;
  
  /**
   * Set local player information to share with peers
   * @param playerInfo Player information object with name and avatar
   */
  setLocalPlayerInfo(playerInfo: { name: string; avatar: string }): void;

  /**
   * Event handler for when a player joins
   */
  onPlayerJoined: ((userId: string) => void) | null;

  /**
   * Event handler for when a player leaves
   */
  onPlayerLeft: ((userId: string) => void) | null;

  /**
   * Event handler for when game state is updated
   */
  onGameStateUpdate: ((state: GameState) => void) | null;

  /**
   * Event handler for when a connection is established
   */
  onConnectionEstablished: ((userId: string) => void) | null;

  /**
   * Event handler for connection status changes
   */
  onConnectionStatusChange: ((status: ConnectionStatus) => void) | null;

  /**
   * Event handler for when player info is received from a peer
   */
  onPlayerInfoUpdate: ((userId: string, playerInfo: { name: string; avatar: string }) => void) | null;

  /**
   * Set local player information to share with peers
   * @param playerInfo Player information object with name and avatar
   */
  setLocalPlayerInfo(playerInfo: { name: string; avatar: string }): void;
}

/**
 * Socket.io events used by the signaling server
 */
export enum SignalingEvents {
  // Client -> Server events
  JOIN_ROOM = "join-room",
  OFFER = "offer",
  ANSWER = "answer",
  ICE_CANDIDATE = "ice-candidate",

  // Server -> Client events
  USER_CONNECTED = "user-connected",
  USER_DISCONNECTED = "user-disconnected",
  EXISTING_USERS = "existing-users",
}
