'use client';

import PiecePreview from '@/components/piece-preview';
import type { PieceType } from '@/lib/tetris/types';
import styles from './index.module.css';

interface NextQueueProps {
  queue: PieceType[];
}

export default function NextQueue({ queue }: NextQueueProps) {
  const visible = queue.slice(0, 5);
  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Next</h2>
      <div className={styles.list}>
        {visible.map((type, index) => (
          <PiecePreview key={`${type}-${index}`} type={type} />
        ))}
      </div>
    </section>
  );
}
