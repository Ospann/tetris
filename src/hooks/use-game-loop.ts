import { useEffect, useRef } from 'react';

export function useGameLoop(running: boolean, onTick: (delta: number) => void): void {
  const callbackRef = useRef(onTick);
  callbackRef.current = onTick;

  useEffect(() => {
    if (!running) return;
    let rafId = 0;
    let last = performance.now();
    const frame = (now: number): void => {
      const delta = Math.min(now - last, 100);
      last = now;
      callbackRef.current(delta);
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [running]);
}
