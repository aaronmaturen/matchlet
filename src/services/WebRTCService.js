import { io } from 'socket.io-client';

class WebRTCService {
  constructor() {
    this.socket = null;
    this.peerConnections = {};
    this.localUserId = null;
    this.roomId = null;
    this.isHost = false;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onGameStateUpdate = null;
    this.onConnectionEstablished = null;
    this.gameState = null;
    
    // STUN servers for NAT traversal
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
  }

  connect(serverUrl, roomId, isHost) {
    this.roomId = roomId;
    this.isHost = isHost;
    this.localUserId = `user_${Math.random().toString(36).substring(2, 9)}`;
    
    // Connect to signaling server
    this.socket = io(serverUrl);
    
    // Set up socket event listeners
    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.socket.emit('join-room', roomId, this.localUserId);
    });
    
    this.socket.on('user-connected', (userId) => {
      console.log(`User connected: ${userId}`);
      this.createPeerConnection(userId);
    });
    
    this.socket.on('user-disconnected', (userId) => {
      console.log(`User disconnected: ${userId}`);
      if (this.peerConnections[userId]) {
        this.peerConnections[userId].close();
        delete this.peerConnections[userId];
      }
      
      if (this.onPlayerLeft) {
        this.onPlayerLeft(userId);
      }
    });
    
    this.socket.on('existing-users', (userIds) => {
      console.log('Existing users:', userIds);
      userIds.forEach(userId => {
        this.createPeerConnection(userId);
      });
    });
    
    this.socket.on('offer', async (offer, fromUserId, toUserId) => {
      if (toUserId === this.localUserId) {
        console.log(`Received offer from ${fromUserId}`);
        await this.handleOffer(offer, fromUserId);
      }
    });
    
    this.socket.on('answer', (answer, fromUserId, toUserId) => {
      if (toUserId === this.localUserId) {
        console.log(`Received answer from ${fromUserId}`);
        this.handleAnswer(answer, fromUserId);
      }
    });
    
    this.socket.on('ice-candidate', (candidate, fromUserId, toUserId) => {
      if (toUserId === this.localUserId) {
        console.log(`Received ICE candidate from ${fromUserId}`);
        this.handleIceCandidate(candidate, fromUserId);
      }
    });
    
    return this.localUserId;
  }
  
  async createPeerConnection(userId) {
    try {
      const peerConnection = new RTCPeerConnection(this.iceServers);
      
      // Set up data channel
      if (this.isHost) {
        const dataChannel = peerConnection.createDataChannel('gameData');
        this.setupDataChannel(dataChannel, userId);
      } else {
        peerConnection.ondatachannel = (event) => {
          this.setupDataChannel(event.channel, userId);
        };
      }
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('ice-candidate', event.candidate, userId);
        }
      };
      
      // Connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${userId}: ${peerConnection.connectionState}`);
        if (peerConnection.connectionState === 'connected') {
          if (this.onConnectionEstablished) {
            this.onConnectionEstablished(userId);
          }
        }
      };
      
      this.peerConnections[userId] = peerConnection;
      
      // If we're the host, create and send an offer
      if (this.isHost) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        this.socket.emit('offer', offer, userId);
      }
      
      if (this.onPlayerJoined) {
        this.onPlayerJoined(userId);
      }
    } catch (error) {
      console.error('Error creating peer connection:', error);
    }
  }
  
  setupDataChannel(dataChannel, userId) {
    dataChannel.onopen = () => {
      console.log(`Data channel with ${userId} opened`);
    };
    
    dataChannel.onclose = () => {
      console.log(`Data channel with ${userId} closed`);
    };
    
    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'gameState' && this.onGameStateUpdate) {
          this.onGameStateUpdate(data.state);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    this.peerConnections[userId].dataChannel = dataChannel;
  }
  
  async handleOffer(offer, userId) {
    const peerConnection = this.peerConnections[userId];
    
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      this.socket.emit('answer', answer, userId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }
  
  async handleAnswer(answer, userId) {
    try {
      const peerConnection = this.peerConnections[userId];
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }
  
  async handleIceCandidate(candidate, userId) {
    try {
      const peerConnection = this.peerConnections[userId];
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }
  
  sendGameState(state) {
    this.gameState = state;
    
    Object.keys(this.peerConnections).forEach(userId => {
      const peerConnection = this.peerConnections[userId];
      if (peerConnection.dataChannel && peerConnection.dataChannel.readyState === 'open') {
        peerConnection.dataChannel.send(JSON.stringify({
          type: 'gameState',
          state
        }));
      }
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    Object.keys(this.peerConnections).forEach(userId => {
      const peerConnection = this.peerConnections[userId];
      if (peerConnection) {
        peerConnection.close();
      }
    });
    
    this.peerConnections = {};
  }
}

export default WebRTCService;
