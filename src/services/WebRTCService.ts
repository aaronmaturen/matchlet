import { io, Socket } from "socket.io-client";
import {
  ConnectionStatus,
  GameState,
  IWebRTCService,
  RTCConfiguration,
  SignalingEvents,
} from "../types/WebRTCTypes";

/**
 * WebRTC Service for peer-to-peer communication
 * Uses the Matchlet WebRTC Signaling Server at https://matchlet-signaling.onrender.com
 */
class WebRTCService implements IWebRTCService {
  private socket: Socket | null = null;
  private peerConnections: Record<
    string,
    RTCPeerConnection & { dataChannel?: RTCDataChannel }
  > = {};
  private localUserId: string | null = null;
  private roomId: string | null = null;
  private isHost: boolean = false;
  private gameState: GameState | null = null;

  // Event handlers
  public onPlayerJoined: ((userId: string) => void) | null = null;
  public onPlayerLeft: ((userId: string) => void) | null = null;
  public onGameStateUpdate: ((state: GameState) => void) | null = null;
  public onConnectionEstablished: ((userId: string) => void) | null = null;
  public onConnectionStatusChange: ((status: ConnectionStatus) => void) | null =
    null;

  // Connection status tracking
  private connectionStatus: ConnectionStatus = {
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempt: 0,
    lastConnected: null,
  };

  // Reconnection settings
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectBackoffFactor = 1.5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // STUN servers for NAT traversal
  private iceServers: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  /**
   * Connect to the signaling server
   * @param serverUrl URL of the signaling server
   * @param roomId Room ID to join
   * @param isHost Whether this client is the host
   * @returns Local user ID
   */
  connect(serverUrl: string, roomId: string, isHost: boolean): string {
    this.roomId = roomId;
    this.isHost = isHost;
    this.localUserId = `user_${Math.random().toString(36).substring(2, 9)}`;

    // Update connection status
    this.updateConnectionStatus({
      connected: false,
      connecting: true,
      error: null,
      reconnectAttempt: 0,
    });

    // Connect to signaling server
    this.socket = io(serverUrl, {
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
      autoConnect: true,
    });

    // Set up socket event listeners
    this.socket.on("connect", () => {
      console.log("Connected to signaling server");
      if (this.socket && this.roomId && this.localUserId) {
        this.socket.emit(
          SignalingEvents.JOIN_ROOM,
          this.roomId,
          this.localUserId
        );
      }

      // Update connection status
      this.updateConnectionStatus({
        connected: true,
        connecting: false,
        error: null,
        lastConnected: new Date().toISOString(),
      });
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.updateConnectionStatus({
        connected: false,
        connecting: true,
        error: `Connection error: ${error.message || "Unknown error"}`,
      });
    });

    this.socket.on("connect_timeout", () => {
      console.error("Connection timeout");
      this.updateConnectionStatus({
        connected: false,
        connecting: false,
        error: "Connection timeout",
      });
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      if (this.socket && this.roomId && this.localUserId) {
        this.socket.emit(
          SignalingEvents.JOIN_ROOM,
          this.roomId,
          this.localUserId
        );
      }

      // Update connection status
      this.updateConnectionStatus({
        connected: true,
        connecting: false,
        error: null,
        reconnectAttempt: 0,
        lastConnected: new Date().toISOString(),
      });

      // Attempt to reconnect to peers
      this.reconnectToPeers();
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.updateConnectionStatus({
        reconnectAttempt: attemptNumber,
      });
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect");
      this.updateConnectionStatus({
        connected: false,
        connecting: false,
        error: "Failed to reconnect after multiple attempts",
      });
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`Disconnected: ${reason}`);
      const willReconnect =
        reason === "io server disconnect" || reason === "transport close";

      this.updateConnectionStatus({
        connected: false,
        connecting: willReconnect,
        error: willReconnect ? null : `Disconnected: ${reason}`,
      });
    });

    this.socket.on(SignalingEvents.USER_CONNECTED, (userId: string) => {
      console.log(`User connected: ${userId}`);
      this.createPeerConnection(userId);
    });

    this.socket.on(SignalingEvents.USER_DISCONNECTED, (userId: string) => {
      console.log(`User disconnected: ${userId}`);
      if (this.peerConnections[userId]) {
        this.peerConnections[userId].close();
        delete this.peerConnections[userId];
      }

      if (this.onPlayerLeft) {
        this.onPlayerLeft(userId);
      }
    });

    this.socket.on(SignalingEvents.EXISTING_USERS, (userIds: string[]) => {
      console.log("Existing users:", userIds);
      userIds.forEach((userId) => {
        this.createPeerConnection(userId);
      });
    });

    this.socket.on(
      SignalingEvents.OFFER,
      async (
        offer: RTCSessionDescriptionInit,
        fromUserId: string,
        toUserId: string
      ) => {
        if (toUserId === this.localUserId) {
          console.log(`Received offer from ${fromUserId}`);
          await this.handleOffer(offer, fromUserId);
        }
      }
    );

    this.socket.on(
      SignalingEvents.ANSWER,
      (
        answer: RTCSessionDescriptionInit,
        fromUserId: string,
        toUserId: string
      ) => {
        if (toUserId === this.localUserId) {
          console.log(`Received answer from ${fromUserId}`);
          this.handleAnswer(answer, fromUserId);
        }
      }
    );

    this.socket.on(
      SignalingEvents.ICE_CANDIDATE,
      (
        candidate: RTCIceCandidateInit,
        fromUserId: string,
        toUserId: string
      ) => {
        if (toUserId === this.localUserId) {
          console.log(`Received ICE candidate from ${fromUserId}`);
          this.handleIceCandidate(candidate, fromUserId);
        }
      }
    );

    return this.localUserId;
  }

  /**
   * Create a peer connection with another user
   * @param userId ID of the user to connect to
   */
  private async createPeerConnection(userId: string): Promise<void> {
    try {
      const peerConnection = new RTCPeerConnection(this.iceServers);

      // Set up data channel
      if (this.isHost) {
        const dataChannel = peerConnection.createDataChannel("gameData");
        this.setupDataChannel(dataChannel, userId);
      } else {
        peerConnection.ondatachannel = (event) => {
          this.setupDataChannel(event.channel, userId);
        };
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.socket && this.localUserId) {
          this.socket.emit(
            SignalingEvents.ICE_CANDIDATE,
            event.candidate,
            userId,
            this.localUserId
          );
        }
      };

      // Connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log(`Connection state change for peer ${userId}: ${state}`);

        if (state === "connected") {
          if (this.onConnectionEstablished) {
            this.onConnectionEstablished(userId);
          }
        } else if (state === "failed" || state === "disconnected") {
          console.log(`Peer connection ${state}: ${userId}`);

          // Schedule reconnection attempt with exponential backoff
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
          }

          const delay =
            this.reconnectDelay *
            Math.pow(
              this.reconnectBackoffFactor,
              this.connectionStatus.reconnectAttempt || 0
            );
          this.reconnectTimer = setTimeout(() => {
            if (this.socket?.connected) {
              console.log(
                `Attempting to reconnect to peer ${userId} after ${delay}ms`
              );
              // Close the old connection
              peerConnection.close();
              delete this.peerConnections[userId];
              // Create a new connection
              this.createPeerConnection(userId);

              // Update reconnect attempt counter
              this.updateConnectionStatus({
                reconnectAttempt:
                  (this.connectionStatus.reconnectAttempt || 0) + 1,
              });
            }
          }, delay);
        }
      };

      this.peerConnections[userId] = peerConnection;

      // If we're the host, create and send an offer
      if (this.isHost) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        if (this.socket && this.localUserId) {
          this.socket.emit(
            SignalingEvents.OFFER,
            offer,
            userId,
            this.localUserId
          );
        }
      }

      if (this.onPlayerJoined) {
        this.onPlayerJoined(userId);
      }
    } catch (error) {
      console.error("Error creating peer connection:", error);
    }
  }

  /**
   * Set up a data channel for communication with a peer
   * @param dataChannel Data channel to set up
   * @param userId ID of the user the data channel is connected to
   */
  private setupDataChannel(dataChannel: RTCDataChannel, userId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel with ${userId} opened`);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel with ${userId} closed`);
    };

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "gameState" && this.onGameStateUpdate) {
          this.onGameStateUpdate(data.state);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    this.peerConnections[userId].dataChannel = dataChannel;
  }

  /**
   * Handle an offer from another peer
   * @param offer Offer from the peer
   * @param userId ID of the user who sent the offer
   */
  private async handleOffer(
    offer: RTCSessionDescriptionInit,
    userId: string
  ): Promise<void> {
    const peerConnection = this.peerConnections[userId];

    try {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      if (this.socket && this.localUserId) {
        this.socket.emit(
          SignalingEvents.ANSWER,
          answer,
          userId,
          this.localUserId
        );
      }
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  /**
   * Handle an answer from another peer
   * @param answer Answer from the peer
   * @param userId ID of the user who sent the answer
   */
  private async handleAnswer(
    answer: RTCSessionDescriptionInit,
    userId: string
  ): Promise<void> {
    try {
      const peerConnection = this.peerConnections[userId];
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }

  /**
   * Handle an ICE candidate from another peer
   * @param candidate ICE candidate from the peer
   * @param userId ID of the user who sent the candidate
   */
  private async handleIceCandidate(
    candidate: RTCIceCandidateInit,
    userId: string
  ): Promise<void> {
    try {
      const peerConnection = this.peerConnections[userId];
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }

  /**
   * Send game state to all connected peers
   * @param state Game state to send
   */
  sendGameState(state: GameState): void {
    this.gameState = state;

    Object.keys(this.peerConnections).forEach((userId) => {
      const peerConnection = this.peerConnections[userId];
      if (
        peerConnection.dataChannel &&
        peerConnection.dataChannel.readyState === "open"
      ) {
        peerConnection.dataChannel.send(
          JSON.stringify({
            type: "gameState",
            state,
          })
        );
      }
    });
  }

  /**
   * Update connection status and trigger event
   * @param status Partial connection status to update
   */
  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...status };

    if (this.onConnectionStatusChange) {
      this.onConnectionStatusChange(this.connectionStatus);
    }
  }

  /**
   * Get current connection status
   * @returns Current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Attempt to reconnect to all known peers
   */
  private reconnectToPeers(): void {
    // Get list of peer IDs we were previously connected to
    const peerIds = Object.keys(this.peerConnections);

    // For each peer with a closed or failed connection, try to reconnect
    for (const peerId of peerIds) {
      const connection = this.peerConnections[peerId];
      const connectionState = connection?.connectionState;

      if (
        connectionState === "closed" ||
        connectionState === "failed" ||
        connectionState === "disconnected"
      ) {
        console.log(`Attempting to reconnect to peer: ${peerId}`);

        // Close the old connection
        connection.close();
        delete this.peerConnections[peerId];

        // Create a new connection
        this.createPeerConnection(peerId);
      }
    }
  }

  /**
   * Disconnect from the signaling server and close all peer connections
   */
  disconnect(): void {
    // Clear any reconnection timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close all peer connections
    for (const userId in this.peerConnections) {
      this.peerConnections[userId].close();
    }
    this.peerConnections = {};

    // Disconnect from signaling server
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.localUserId = null;
    this.roomId = null;
    this.isHost = false;
    this.gameState = null;

    // Update connection status
    this.updateConnectionStatus({
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempt: 0,
    });
  }
}

export default WebRTCService;
