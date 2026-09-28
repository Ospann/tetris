export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;

export type PieceType = (typeof PIECE_TYPES)[number];

export type Rotation = 0 | 1 | 2 | 3;

export type Cell = PieceType | null;

export type Board = Cell[][];

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'over';

export type TSpinKind = 'none' | 'mini' | 'full';

export interface GameMessage {
  id: number;
  text: string;
}

export interface GameState {
  board: Board;
  active: ActivePiece | null;
  hold: PieceType | null;
  holdUsed: boolean;
  queue: PieceType[];
  seed: number;
  status: GameStatus;
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  softDropping: boolean;
  gravityAcc: number;
  lockElapsed: number;
  lockResets: number;
  lastAction: 'move' | 'rotate' | null;
  lastKickIndex: number;
  message: GameMessage | null;
}

export type GameAction =
  | { type: 'start'; seed: number }
  | { type: 'tick'; delta: number }
  | { type: 'move'; dx: -1 | 1 }
  | { type: 'rotate'; dir: 1 | -1 }
  | { type: 'softDrop'; on: boolean }
  | { type: 'hardDrop' }
  | { type: 'hold' }
  | { type: 'togglePause' };
