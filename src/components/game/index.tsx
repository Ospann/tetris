'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import BoardCanvas from '@/components/board-canvas';
import HoldBox from '@/components/hold-box';
import NextQueue from '@/components/next-queue';
import ScorePanel from '@/components/score-panel';
import TouchControls from '@/components/touch-controls';
import { useGameLoop } from '@/hooks/use-game-loop';
import { useKeyboard } from '@/hooks/use-keyboard';
import { useTouch } from '@/hooks/use-touch';
import { createInitialState, reduce } from '@/lib/tetris/engine';
import styles from './index.module.css';

const HIGH_SCORE_KEY = 'tetris-high-score';

export default function Game() {
  const [state, dispatch] = useReducer(reduce, undefined, createInitialState);
  const [highScore, setHighScore] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) ?? '0');
    if (Number.isFinite(stored) && stored > 0) setHighScore(stored);
  }, []);

  useEffect(() => {
    if (state.score > 0) {
      setHighScore((prev) => {
        if (state.score <= prev) return prev;
        window.localStorage.setItem(HIGH_SCORE_KEY, String(state.score));
        return state.score;
      });
    }
  }, [state.score]);

  useGameLoop(state.status === 'playing', (delta) => dispatch({ type: 'tick', delta }));

  const startGame = (): void => dispatch({ type: 'start', seed: Date.now() });

  const handleOverlayTap = (): void => {
    const status = stateRef.current.status;
    if (status === 'idle' || status === 'over') startGame();
    else if (status === 'paused') dispatch({ type: 'togglePause' });
  };

  useKeyboard({
    onMove: (dx) => dispatch({ type: 'move', dx }),
    onRotate: (dir) => dispatch({ type: 'rotate', dir }),
    onSoftDrop: (on) => dispatch({ type: 'softDrop', on }),
    onHardDrop: () => dispatch({ type: 'hardDrop' }),
    onHold: () => dispatch({ type: 'hold' }),
    onPause: () => dispatch({ type: 'togglePause' }),
    onStart: () => {
      const status = stateRef.current.status;
      if (status === 'idle' || status === 'over') startGame();
    },
    onRestart: startGame,
  });

  useTouch(boardRef, {
    onMove: (dx) => dispatch({ type: 'move', dx }),
    onRotate: (dir) => dispatch({ type: 'rotate', dir }),
    onSoftDrop: (on) => dispatch({ type: 'softDrop', on }),
    onHardDrop: () => dispatch({ type: 'hardDrop' }),
  });

  return (
    <div className={styles.game}>
      <div className={styles.holdArea}>
        <HoldBox piece={state.hold} used={state.holdUsed} />
      </div>
      <div className={styles.scoreArea}>
        <ScorePanel
          score={state.score}
          highScore={highScore}
          level={state.level}
          lines={state.lines}
          message={state.message}
        />
      </div>
      <div ref={boardRef} className={styles.boardArea}>
        <BoardCanvas board={state.board} active={state.active} />
        {state.status === 'idle' && (
          <div className={styles.overlay} onClick={handleOverlayTap}>
            <span className={styles.overlayTitle}>TETRIS</span>
            <span className={styles.overlayHint}>Press Enter or tap to start</span>
            <ul className={styles.controls}>
              <li>← → — move, tap — rotate</li>
              <li>↑ / X — rotate CW, Z — CCW</li>
              <li>↓ / drag down — soft drop</li>
              <li>Space / flick down — hard drop</li>
              <li>C / Shift — hold, P / Esc — pause</li>
            </ul>
          </div>
        )}
        {state.status === 'paused' && (
          <div className={styles.overlay} onClick={handleOverlayTap}>
            <span className={styles.overlayTitle}>PAUSED</span>
            <span className={styles.overlayHint}>Press P or tap to resume</span>
          </div>
        )}
        {state.status === 'over' && (
          <div className={styles.overlay} onClick={handleOverlayTap}>
            <span className={styles.overlayTitle}>GAME OVER</span>
            <span className={styles.overlayScore}>
              {state.score.toLocaleString('en-US')}
            </span>
            <span className={styles.overlayHint}>Press Enter or tap to play again</span>
          </div>
        )}
      </div>
      <div className={styles.nextArea}>
        <NextQueue queue={state.queue} />
      </div>
      <div className={styles.controlsArea}>
        <TouchControls
          onMove={(dx) => dispatch({ type: 'move', dx })}
          onRotate={(dir) => dispatch({ type: 'rotate', dir })}
          onSoftDrop={(on) => dispatch({ type: 'softDrop', on })}
          onHardDrop={() => dispatch({ type: 'hardDrop' })}
          onHold={() => dispatch({ type: 'hold' })}
          onPause={() => dispatch({ type: 'togglePause' })}
        />
      </div>
    </div>
  );
}
