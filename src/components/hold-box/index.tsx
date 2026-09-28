'use client';

import PiecePreview from '@/components/piece-preview';
import type { PieceType } from '@/lib/tetris/types';
import styles from './index.module.css';

interface HoldBoxProps {
  piece: PieceType | null;
  used: boolean;
}

export default function HoldBox({ piece, used }: HoldBoxProps) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Hold</h2>
      <div className={used ? styles.used : styles.preview}>
        <PiecePreview type={piece} />
      </div>
    </section>
  );
}
