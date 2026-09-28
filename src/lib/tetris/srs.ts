import { collides } from './board';
import type { ActivePiece, Board, Rotation } from './types';

type Kick = readonly [number, number];

const JLSTZ_KICKS: Record<string, readonly Kick[]> = {
  '01': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '10': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '12': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '21': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '23': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '32': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '30': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '03': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: Record<string, readonly Kick[]> = {
  '01': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '10': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '12': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '21': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '23': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '32': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '30': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '03': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const NO_KICKS: readonly Kick[] = [[0, 0]];

export function tryRotate(
  board: Board,
  piece: ActivePiece,
  dir: 1 | -1,
): { piece: ActivePiece; kickIndex: number } | null {
  const rotation = ((piece.rotation + (dir === 1 ? 1 : 3)) % 4) as Rotation;
  const table = piece.type === 'I' ? I_KICKS : JLSTZ_KICKS;
  const kicks = piece.type === 'O' ? NO_KICKS : table[`${piece.rotation}${rotation}`];
  for (let i = 0; i < kicks.length; i += 1) {
    const [dx, dy] = kicks[i];
    const candidate: ActivePiece = { ...piece, rotation, x: piece.x + dx, y: piece.y - dy };
    if (!collides(board, candidate)) {
      return { piece: candidate, kickIndex: i };
    }
  }
  return null;
}
