'use client';

import styles from './index.module.css';

interface ScorePanelProps {
  score: number;
  highScore: number;
  level: number;
  lines: number;
}

export default function ScorePanel({ score, highScore, level, lines }: ScorePanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.label}>Score</span>
        <span className={styles.value}>{score.toLocaleString('en-US')}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Best</span>
        <span className={styles.value}>{highScore.toLocaleString('en-US')}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Level</span>
        <span className={styles.value}>{level}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Lines</span>
        <span className={styles.value}>{lines}</span>
      </div>
    </section>
  );
}
