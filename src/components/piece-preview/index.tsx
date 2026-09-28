'use client';

import { useEffect, useRef } from 'react';
import { PIECE_CELLS } from '@/lib/tetris/pieces';
import { drawCell } from '@/lib/tetris/render';
import type { PieceType } from '@/lib/tetris/types';
import styles from './index.module.css';

const CELL = 18;
const WIDTH = CELL * 4 + 8;
const HEIGHT = CELL * 2 + 8;

interface PiecePreviewProps {
  type: PieceType | null;
}

export default function PiecePreview({ type }: PiecePreviewProps) {
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
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (!type) return;

    const cells = PIECE_CELLS[type][0];
    const xs = cells.map(([x]) => x);
    const ys = cells.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const offsetX = (WIDTH - (maxX - minX + 1) * CELL) / 2 - minX * CELL;
    const offsetY = (HEIGHT - (maxY - minY + 1) * CELL) / 2 - minY * CELL;

    for (const [x, y] of cells) {
      drawCell(ctx, offsetX + x * CELL, offsetY + y * CELL, CELL, type);
    }
  }, [type]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
