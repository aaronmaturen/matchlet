import { ConnectionStatus } from './WebRTCTypes';

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
}

export interface GameConfigType {
  boardSize: string;
  gridCols: number;
  gridRows: number;
  players: PlayerType[];
  cardset: string;
}

export interface GameModeType {
  mode: string;
  roomId?: string;
  isHost?: boolean;
}
