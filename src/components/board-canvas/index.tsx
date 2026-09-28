'use client';

import { useEffect, useRef } from 'react';
import { COLS, HIDDEN_ROWS, ROWS, ghostY, pieceCells } from '@/lib/tetris/board';
import { drawCell, drawGhostCell } from '@/lib/tetris/render';
import type { ActivePiece, Board } from '@/lib/tetris/types';
import styles from './index.module.css';

const CELL = 30;
const WIDTH = COLS * CELL;
const HEIGHT = (ROWS - HIDDEN_ROWS) * CELL;

interface BoardCanvasProps {
  board: Board;
  active: ActivePiece | null;
}

export default function BoardCanvas({ board, active }: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== WIDTH * dpr) {
      canvas.width = WIDTH * dpr;
      canvas.height = HEIGHT * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0b101f';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, HEIGHT);
      ctx.stroke();
    }
    for (let y = 1; y < ROWS - HIDDEN_ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(WIDTH, y * CELL + 0.5);
      ctx.stroke();
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
  }, [board, active]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
