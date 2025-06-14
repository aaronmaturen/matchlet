import React from 'react';
import { ConnectionStatus as ConnectionStatusType } from '../types/WebRTCTypes';

interface ConnectionStatusProps {
  connectionStatus?: ConnectionStatusType;
  roomId: string | null;
  error: string | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  connectionStatus, 
  roomId, 
  error 
}) => {
  if (!roomId) return null;

  return (
    <div className="tw-mt-3">
      <p className="font-comic text-lg">Room: <span className="tw-badge tw-badge-outline">{roomId}</span></p>
      
      {/* Connection Status Badge */}
      <div className="tw-flex tw-items-center tw-mt-2">
        <span className="tw-mr-2">Status:</span>
        {connectionStatus?.connected ? (
          <span className="tw-badge tw-badge-success">Connected</span>
        ) : (
          <span className="tw-badge tw-badge-error">Disconnected</span>
        )}
      </div>
      
      {/* Reconnection Attempts */}
      {connectionStatus?.reconnecting && (
        <p className="tw-text-sm tw-mt-1">
          Reconnecting... Attempt {connectionStatus.reconnectAttempt}/{connectionStatus.maxReconnectAttempts}
        </p>
      )}
      
      {/* Connection Error */}
      {error && (
        <div className="tw-alert tw-alert-error tw-mt-2 tw-p-2 tw-text-sm">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
