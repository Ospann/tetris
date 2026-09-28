import { PIECE_COLORS } from './pieces';
import type { PieceType } from './types';

export function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: PieceType,
): void {
  ctx.fillStyle = PIECE_COLORS[type];
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(x, y, size, size * 0.16);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(x, y + size * 0.84, size, size * 0.16);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

export function drawGhostCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: PieceType,
): void {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = PIECE_COLORS[type];
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
  ctx.restore();
}
