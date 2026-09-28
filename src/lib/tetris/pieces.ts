import { PIECE_TYPES } from './types';
import type { PieceType } from './types';

export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#46c8e0',
  O: '#e0c040',
  T: '#a556e8',
  S: '#5ad05a',
  Z: '#e05a5a',
  J: '#5a78e8',
  L: '#e0924a',
};

export type CellOffset = readonly [number, number];

export const SPAWN_X = 3;
export const SPAWN_Y = 18;

const BASE_SHAPES: Record<PieceType, { size: number; cells: readonly CellOffset[] }> = {
  I: { size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { size: 3, cells: [[1, 0], [2, 0], [1, 1], [2, 1]] },
  T: { size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};

function rotateCw(cells: readonly CellOffset[], size: number): CellOffset[] {
  return cells.map(([x, y]) => [size - 1 - y, x] as const);
}

function buildRotations(type: PieceType): CellOffset[][] {
  const { size, cells } = BASE_SHAPES[type];
  const base = cells.slice();
  if (type === 'O') return [base, base, base, base];
  const rotations: CellOffset[][] = [base];
  for (let i = 1; i < 4; i += 1) {
    rotations.push(rotateCw(rotations[i - 1], size));
  }
  return rotations;
}

export const PIECE_CELLS = Object.fromEntries(
  PIECE_TYPES.map((type) => [type, buildRotations(type)]),
) as Record<PieceType, CellOffset[][]>;
