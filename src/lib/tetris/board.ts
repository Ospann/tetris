import { PIECE_CELLS } from './pieces';
import type { ActivePiece, Board, Cell } from './types';

export const COLS = 10;
export const ROWS = 40;
export const HIDDEN_ROWS = 20;
export const VISIBLE_ROWS = ROWS - HIDDEN_ROWS;

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

export function pieceCells(piece: ActivePiece): Array<[number, number]> {
  return PIECE_CELLS[piece.type][piece.rotation].map(([x, y]) => [piece.x + x, piece.y + y]);
}

export function collides(board: Board, piece: ActivePiece): boolean {
  return pieceCells(piece).some(
    ([x, y]) => x < 0 || x >= COLS || y < 0 || y >= ROWS || board[y][x] !== null,
  );
}

export function merge(board: Board, piece: ActivePiece): Board {
  const next = board.map((row) => row.slice());
  for (const [x, y] of pieceCells(piece)) {
    next[y][x] = piece.type;
  }
  return next;
}

export function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter((row) => row.some((cell) => cell === null));
  const cleared = ROWS - kept.length;
  if (cleared === 0) return { board, cleared };
  const empty = Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(null));
  return { board: [...empty, ...kept], cleared };
}

export function ghostY(board: Board, piece: ActivePiece): number {
  let y = piece.y;
  while (!collides(board, { ...piece, y: y + 1 })) {
    y += 1;
  }
  return y;
}

export function isBoardEmpty(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell === null));
}
