import React from "react";
import { ConnectionStatus as ConnectionStatusType } from "../types/WebRTCTypes";

interface ConnectionStatusProps {
  connectionStatus?: ConnectionStatusType;
  roomId: string | null;
  error: string | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  roomId,
  error,
}) => {
  if (!roomId) return null;

  return (
    <div className="mt-3">
      <p className="font-comic text-lg">
        Room: <span className="badge badge-outline">{roomId}</span>
      </p>

      {/* Connection Status Badge */}
      <div className="mt-2 flex items-center">
        <span className="mr-2">Status:</span>
        {connectionStatus?.connected ? (
          <span className="badge badge-success">Connected</span>
        ) : (
          <span className="badge badge-error">Disconnected</span>
        )}
      </div>

      {/* Reconnection Attempts */}
      {connectionStatus?.reconnecting && (
        <p className="mt-1 text-sm">
          Reconnecting... Attempt {connectionStatus.reconnectAttempt}/
          {connectionStatus.maxReconnectAttempts}
        </p>
      )}

      {/* Connection Error */}
      {error && (
        <div className="alert alert-error mt-2 p-2 text-sm">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
