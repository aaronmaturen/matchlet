import { ConnectionStatus, RoomState } from "./WebRTCTypes";

export interface GameProps {
  triggerReset: boolean;
  onResetComplete: () => void;
  gameMode?: {
    mode: string;
    roomId?: string;
    isHost?: boolean;
  };
  initialGameConfig?: GameConfigType;
  onBackToMenu?: () => void;
}

export interface CardType {
  id: number;
  value: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface PlayerType {
  name: string;
  color: string;
  avatar: string;
}

export interface OnlineStatusType {
  connected: boolean;
  roomId: string | null;
  isHost: boolean;
  players: string[];
  error: string | null;
  connectionStatus?: ConnectionStatus;
  localPlayerId?: string | null;
  playersInfo?: Record<string, { name: string; avatar: string }>;
  roomState?: RoomState;
}

export interface GameConfigType {
  boardSize: string;
  gridCols: number;
  gridRows: number;
  players: PlayerType[];
  cardset: string;
}
