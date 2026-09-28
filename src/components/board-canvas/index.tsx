'use client';

import { useEffect, useRef, useState } from 'react';
import { COLS, HIDDEN_ROWS, ROWS, ghostY, pieceCells } from '@/lib/tetris/board';
import { CLEARING_MS, LOCK_FLASH_MS } from '@/lib/tetris/engine';
import { drawCell, drawGhostCell } from '@/lib/tetris/render';
import type { ActivePiece, Board, ClearingState, LockFlashState } from '@/lib/tetris/types';
import styles from './index.module.css';

const CELL = 30;
const WIDTH = COLS * CELL;
const HEIGHT = (ROWS - HIDDEN_ROWS) * CELL;

interface BoardCanvasProps {
  board: Board;
  active: ActivePiece | null;
  clearing: ClearingState | null;
  lockFlash: LockFlashState | null;
}

export default function BoardCanvas({ board, active, clearing, lockFlash }: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resizeTick, setResizeTick] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setResizeTick((tick) => tick + 1));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const bufferWidth = Math.max(1, Math.round(rect.width * dpr));
    const bufferHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== bufferWidth) canvas.width = bufferWidth;
    if (canvas.height !== bufferHeight) canvas.height = bufferHeight;
    ctx.setTransform(bufferWidth / WIDTH, 0, 0, bufferHeight / HEIGHT, 0, 0);

    ctx.fillStyle = '#0b101f';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = 1; x < COLS; x += 1) {
      ctx.fillRect(x * CELL - 0.5, 0, 1, HEIGHT);
    }
    for (let y = 1; y < ROWS - HIDDEN_ROWS; y += 1) {
      ctx.fillRect(0, y * CELL - 0.5, WIDTH, 1);
    }

    for (let y = HIDDEN_ROWS; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = board[y][x];
        if (cell !== null) {
          drawCell(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, cell);
        }
      }
    }

    if (active) {
      const ghost = { ...active, y: ghostY(board, active) };
      if (ghost.y !== active.y) {
        for (const [x, y] of pieceCells(ghost)) {
          if (y >= HIDDEN_ROWS) {
            drawGhostCell(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, active.type);
          }
        }
      }
      for (const [x, y] of pieceCells(active)) {
        if (y >= HIDDEN_ROWS) {
          drawCell(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, active.type);
        }
      }
    }

    if (lockFlash) {
      const alpha = 0.55 * Math.max(0, 1 - lockFlash.elapsed / LOCK_FLASH_MS);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      for (const [x, y] of lockFlash.cells) {
        if (y >= HIDDEN_ROWS) {
          ctx.fillRect(x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, CELL);
        }
      }
    }

    if (clearing) {
      const progress = Math.min(1, clearing.elapsed / CLEARING_MS);
      for (const row of clearing.rows) {
        if (row < HIDDEN_ROWS) continue;
        const top = (row - HIDDEN_ROWS) * CELL;
        ctx.fillStyle = '#0b101f';
        ctx.fillRect(0, top, WIDTH, CELL);
        const bandHeight = CELL * (1 - progress);
        const bandAlpha = 0.95 * (1 - progress * 0.4);
        ctx.fillStyle = `rgba(255, 255, 255, ${bandAlpha.toFixed(3)})`;
        ctx.fillRect(0, top + (CELL - bandHeight) / 2, WIDTH, bandHeight);
      }
    }
  }, [board, active, clearing, lockFlash, resizeTick]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
