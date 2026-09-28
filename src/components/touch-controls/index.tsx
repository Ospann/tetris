'use client';

import { useEffect, useRef } from 'react';
import styles from './index.module.css';

const REPEAT_DELAY_MS = 200;
const REPEAT_INTERVAL_MS = 50;

interface TouchControlsProps {
  onMove: (dx: -1 | 1) => void;
  onRotate: (dir: 1 | -1) => void;
  onSoftDrop: (on: boolean) => void;
  onHardDrop: () => void;
  onHold: () => void;
  onPause: () => void;
}

export default function TouchControls({
  onMove,
  onRotate,
  onSoftDrop,
  onHardDrop,
  onHold,
  onPause,
}: TouchControlsProps) {
  const moveRef = useRef(onMove);
  moveRef.current = onMove;
  const timersRef = useRef<{ delay: number | null; interval: number | null }>({
    delay: null,
    interval: null,
  });

  const stopRepeat = (): void => {
    const timers = timersRef.current;
    if (timers.delay !== null) {
      window.clearTimeout(timers.delay);
      timers.delay = null;
    }
    if (timers.interval !== null) {
      window.clearInterval(timers.interval);
      timers.interval = null;
    }
  };

  const startRepeat = (dir: -1 | 1): void => {
    stopRepeat();
    moveRef.current(dir);
    timersRef.current.delay = window.setTimeout(() => {
      timersRef.current.interval = window.setInterval(
        () => moveRef.current(dir),
        REPEAT_INTERVAL_MS,
      );
    }, REPEAT_DELAY_MS);
  };

  useEffect(() => stopRepeat, []);

  return (
    <div className={styles.controls}>
      <div className={styles.cluster}>
        <button
          type="button"
          className={styles.button}
          aria-label="Move left"
          onPointerDown={(event) => {
            event.preventDefault();
            startRepeat(-1);
          }}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          onContextMenu={(event) => event.preventDefault()}
        >
          ←
        </button>
        <button
          type="button"
          className={styles.button}
          aria-label="Soft drop"
          onPointerDown={(event) => {
            event.preventDefault();
            onSoftDrop(true);
          }}
          onPointerUp={() => onSoftDrop(false)}
          onPointerLeave={() => onSoftDrop(false)}
          onPointerCancel={() => onSoftDrop(false)}
          onContextMenu={(event) => event.preventDefault()}
        >
          ↓
        </button>
        <button
          type="button"
          className={styles.button}
          aria-label="Move right"
          onPointerDown={(event) => {
            event.preventDefault();
            startRepeat(1);
          }}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          onContextMenu={(event) => event.preventDefault()}
        >
          →
        </button>
      </div>
      <div className={styles.clusterSmall}>
        <button
          type="button"
          className={styles.smallButton}
          onPointerDown={(event) => {
            event.preventDefault();
            onHold();
          }}
        >
          Hold
        </button>
        <button
          type="button"
          className={styles.smallButton}
          onPointerDown={(event) => {
            event.preventDefault();
            onPause();
          }}
        >
          Pause
        </button>
      </div>
      <div className={styles.cluster}>
        <button
          type="button"
          className={styles.button}
          aria-label="Rotate counter-clockwise"
          onPointerDown={(event) => {
            event.preventDefault();
            onRotate(-1);
          }}
        >
          ↺
        </button>
        <button
          type="button"
          className={styles.button}
          aria-label="Rotate clockwise"
          onPointerDown={(event) => {
            event.preventDefault();
            onRotate(1);
          }}
        >
          ↻
        </button>
        <button
          type="button"
          className={styles.button}
          aria-label="Hard drop"
          onPointerDown={(event) => {
            event.preventDefault();
            onHardDrop();
          }}
        >
          ⤓
        </button>
      </div>
    </div>
  );
}
