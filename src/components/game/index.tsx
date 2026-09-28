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
import { isMuted, playSound, setMuted, vibrate } from '@/lib/audio';
import { formatTime } from '@/lib/format-time';
import { SPRINT_LINES, createInitialState, reduce } from '@/lib/tetris/engine';
import type { GameMode } from '@/lib/tetris/types';
import styles from './index.module.css';

const MODE_KEY = 'tetris-mode';
const MUTED_KEY = 'tetris-muted';
const BEST_KEYS: Record<GameMode, string> = {
  marathon: 'tetris-best-marathon',
  sprint: 'tetris-best-sprint',
  ultra: 'tetris-best-ultra',
};
const LEGACY_BEST_KEY = 'tetris-high-score';

const MODE_LABELS: Record<GameMode, string> = {
  marathon: 'Marathon',
  sprint: 'Sprint 40L',
  ultra: 'Ultra 2:00',
};

const MODE_HINTS: Record<GameMode, string> = {
  marathon: 'Endless, speed rises every 10 lines',
  sprint: `Clear ${SPRINT_LINES} lines as fast as you can`,
  ultra: 'Score as much as you can in 2 minutes',
};

function readNumber(key: string): number {
  const value = Number(window.localStorage.getItem(key) ?? '0');
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export default function Game() {
  const [state, dispatch] = useReducer(reduce, undefined, createInitialState);
  const [mode, setMode] = useState<GameMode>('marathon');
  const [bests, setBests] = useState<Record<GameMode, number>>({
    marathon: 0,
    sprint: 0,
    ultra: 0,
  });
  const [muted, setMutedState] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const boardRef = useRef<HTMLDivElement>(null);
  const prevLevelRef = useRef(1);

  useEffect(() => {
    setBests({
      marathon: Math.max(readNumber(BEST_KEYS.marathon), readNumber(LEGACY_BEST_KEY)),
      sprint: readNumber(BEST_KEYS.sprint),
      ultra: readNumber(BEST_KEYS.ultra),
    });
    const storedMode = window.localStorage.getItem(MODE_KEY);
    if (storedMode === 'marathon' || storedMode === 'sprint' || storedMode === 'ultra') {
      setMode(storedMode);
    }
    const storedMuted = window.localStorage.getItem(MUTED_KEY) === '1';
    setMuted(storedMuted);
    setMutedState(storedMuted);
  }, []);

  useEffect(() => {
    if (state.mode === 'sprint' || state.score === 0) return;
    setBests((prev) => {
      if (state.score <= prev[state.mode]) return prev;
      window.localStorage.setItem(BEST_KEYS[state.mode], String(state.score));
      return { ...prev, [state.mode]: state.score };
    });
  }, [state.score, state.mode]);

  useEffect(() => {
    if (state.status === 'over') {
      playSound('gameOver');
      vibrate(120);
    }
    if (state.status === 'won') {
      playSound('big');
      vibrate(80);
      if (state.mode === 'sprint') {
        const time = Math.round(state.elapsedMs);
        setBests((prev) => {
          const beat = prev.sprint === 0 || time < prev.sprint;
          setNewRecord(beat);
          if (!beat) return prev;
          window.localStorage.setItem(BEST_KEYS.sprint, String(time));
          return { ...prev, sprint: time };
        });
      }
    }
  }, [state.status]);

  useEffect(() => {
    if (!state.message) return;
    const big = /Tetris|T-Spin|Perfect/.test(state.message.text);
    playSound(big ? 'big' : 'clear');
    vibrate(big ? 60 : 30);
  }, [state.message]);

  useEffect(() => {
    if (state.lockFlash && state.lockFlash.elapsed === 0) {
      playSound('lock');
      vibrate(15);
    }
  }, [state.lockFlash]);

  useEffect(() => {
    if (state.shake?.magnitude === 'small') playSound('hardDrop');
  }, [state.shake]);

  useEffect(() => {
    if (state.level > prevLevelRef.current && state.status === 'playing') {
      playSound('levelUp');
    }
    prevLevelRef.current = state.level;
  }, [state.level, state.status]);

  useGameLoop(state.status === 'playing', (delta) => dispatch({ type: 'tick', delta }));

  useEffect(() => {
    const element = boardRef.current;
    const shake = state.shake;
    if (!element || !shake) return;
    const className = shake.magnitude === 'big' ? styles.shakeBig : styles.shakeSmall;
    element.classList.remove(styles.shakeBig, styles.shakeSmall);
    void element.offsetWidth;
    element.classList.add(className);
    const onEnd = (): void => element.classList.remove(className);
    element.addEventListener('animationend', onEnd);
    return () => element.removeEventListener('animationend', onEnd);
  }, [state.shake]);

  const startGame = (): void => {
    setNewRecord(false);
    playSound('start');
    dispatch({ type: 'start', seed: Date.now(), mode });
  };

  const selectMode = (next: GameMode): void => {
    setMode(next);
    window.localStorage.setItem(MODE_KEY, next);
  };

  const toggleMute = (): void => {
    const next = !isMuted();
    setMuted(next);
    setMutedState(next);
    window.localStorage.setItem(MUTED_KEY, next ? '1' : '0');
  };

  const handleMove = (dx: -1 | 1): void => {
    if (stateRef.current.status === 'playing') playSound('move');
    dispatch({ type: 'move', dx });
  };

  const handleRotate = (dir: 1 | -1): void => {
    if (stateRef.current.status === 'playing') playSound('rotate');
    dispatch({ type: 'rotate', dir });
  };

  const handleHold = (): void => {
    const current = stateRef.current;
    if (current.status === 'playing' && !current.holdUsed) playSound('hold');
    dispatch({ type: 'hold' });
  };

  const handleOverlayTap = (): void => {
    const status = stateRef.current.status;
    if (status === 'idle' || status === 'over' || status === 'won') startGame();
    else if (status === 'paused') dispatch({ type: 'togglePause' });
  };

  useKeyboard({
    onMove: handleMove,
    onRotate: handleRotate,
    onSoftDrop: (on) => dispatch({ type: 'softDrop', on }),
    onHardDrop: () => dispatch({ type: 'hardDrop' }),
    onHold: handleHold,
    onPause: () => dispatch({ type: 'togglePause' }),
    onStart: () => {
      const status = stateRef.current.status;
      if (status === 'idle' || status === 'over' || status === 'won') startGame();
    },
    onRestart: startGame,
  });

  useTouch(boardRef, {
    onMove: handleMove,
    onRotate: handleRotate,
    onSoftDrop: (on) => dispatch({ type: 'softDrop', on }),
    onHardDrop: () => dispatch({ type: 'hardDrop' }),
  });

  const activeMode = state.status === 'idle' ? mode : state.mode;

  return (
    <div className={styles.game}>
      <div className={styles.holdArea}>
        <HoldBox piece={state.hold} used={state.holdUsed} />
      </div>
      <div className={styles.scoreArea}>
        <ScorePanel
          mode={activeMode}
          score={state.score}
          bestScore={bests[activeMode]}
          level={state.level}
          lines={state.lines}
          elapsedMs={state.elapsedMs}
          muted={muted}
          onToggleMute={toggleMute}
        />
      </div>
      <div ref={boardRef} className={styles.boardArea}>
        <BoardCanvas
          board={state.board}
          active={state.active}
          clearing={state.clearing}
          lockFlash={state.lockFlash}
        />
        {state.message && (
          <div key={state.message.id} className={styles.floatMessage}>
            {state.message.text}
          </div>
        )}
        {state.status === 'idle' && (
          <div className={styles.overlay} onClick={handleOverlayTap}>
            <span className={styles.overlayTitle}>TETRIS</span>
            <div className={styles.modes} onClick={(event) => event.stopPropagation()}>
              {(['marathon', 'sprint', 'ultra'] as const).map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className={entry === mode ? styles.modeActive : styles.mode}
                  onClick={() => selectMode(entry)}
                >
                  {MODE_LABELS[entry]}
                </button>
              ))}
            </div>
            <span className={styles.overlayHint}>{MODE_HINTS[mode]}</span>
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
        {state.status === 'won' && (
          <div className={styles.overlay} onClick={handleOverlayTap}>
            <span className={styles.overlayTitle}>
              {state.mode === 'sprint' ? 'FINISHED!' : "TIME'S UP!"}
            </span>
            <span className={styles.overlayScore}>
              {state.mode === 'sprint'
                ? formatTime(state.elapsedMs)
                : state.score.toLocaleString('en-US')}
            </span>
            {newRecord && <span className={styles.overlayRecord}>New record!</span>}
            <span className={styles.overlayHint}>Press Enter or tap to play again</span>
          </div>
        )}
      </div>
      <div className={styles.nextArea}>
        <NextQueue queue={state.queue} />
      </div>
      <div className={styles.controlsArea}>
        <TouchControls
          onMove={handleMove}
          onRotate={handleRotate}
          onSoftDrop={(on) => dispatch({ type: 'softDrop', on })}
          onHardDrop={() => dispatch({ type: 'hardDrop' })}
          onHold={handleHold}
          onPause={() => dispatch({ type: 'togglePause' })}
        />
      </div>
    </div>
  );
}
