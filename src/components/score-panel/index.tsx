'use client';

import { formatTime } from '@/lib/format-time';
import { SPRINT_LINES, ULTRA_MS } from '@/lib/tetris/engine';
import type { GameMode } from '@/lib/tetris/types';
import styles from './index.module.css';

interface ScorePanelProps {
  mode: GameMode;
  score: number;
  bestScore: number;
  level: number;
  lines: number;
  elapsedMs: number;
  muted: boolean;
  onToggleMute: () => void;
}

export default function ScorePanel({
  mode,
  score,
  bestScore,
  level,
  lines,
  elapsedMs,
  muted,
  onToggleMute,
}: ScorePanelProps) {
  const best =
    mode === 'sprint'
      ? bestScore > 0
        ? formatTime(bestScore)
        : '—'
      : bestScore.toLocaleString('en-US');
  const time =
    mode === 'ultra' ? formatTime(Math.max(0, ULTRA_MS - elapsedMs)) : formatTime(elapsedMs);
  const linesValue = mode === 'sprint' ? `${lines}/${SPRINT_LINES}` : String(lines);

  return (
    <section className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.label}>Score</span>
        <span className={styles.value}>{score.toLocaleString('en-US')}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Best</span>
        <span className={styles.value}>{best}</span>
      </div>
      {mode === 'marathon' && (
        <div className={styles.row}>
          <span className={styles.label}>Level</span>
          <span className={styles.value}>{level}</span>
        </div>
      )}
      <div className={styles.row}>
        <span className={styles.label}>Lines</span>
        <span className={styles.value}>{linesValue}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Time</span>
        <span className={styles.value}>{time}</span>
      </div>
      <button type="button" className={styles.muteButton} onClick={onToggleMute}>
        {muted ? 'Sound: off' : 'Sound: on'}
      </button>
    </section>
  );
}
