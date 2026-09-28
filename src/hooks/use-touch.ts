import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const TAP_MAX_MS = 250;
const TAP_MAX_DIST = 12;
const FLICK_MIN_DIST = 60;
const FLICK_MIN_VELOCITY = 0.6;
const SOFT_DROP_START_DIST = 24;

export interface TouchHandlers {
  onMove: (dx: -1 | 1) => void;
  onRotate: (dir: 1 | -1) => void;
  onSoftDrop: (on: boolean) => void;
  onHardDrop: () => void;
}

export function useTouch(ref: RefObject<HTMLElement | null>, handlers: TouchHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastX = 0;
    let lastY = 0;
    let accX = 0;
    let axis: 'h' | 'v' | null = null;
    let softDropping = false;
    let tracking = false;

    const onTouchStart = (event: TouchEvent): void => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      tracking = true;
      startX = lastX = touch.clientX;
      startY = lastY = touch.clientY;
      startTime = performance.now();
      accX = 0;
      axis = null;
      softDropping = false;
    };

    const onTouchMove = (event: TouchEvent): void => {
      if (!tracking) return;
      event.preventDefault();
      const touch = event.touches[0];
      const dx = touch.clientX - lastX;
      lastX = touch.clientX;
      lastY = touch.clientY;
      const totalX = touch.clientX - startX;
      const totalY = touch.clientY - startY;
      if (axis === null && Math.hypot(totalX, totalY) > TAP_MAX_DIST) {
        axis = Math.abs(totalX) > Math.abs(totalY) ? 'h' : 'v';
      }
      if (axis === 'h') {
        const cell = element.getBoundingClientRect().width / 10;
        accX += dx;
        while (Math.abs(accX) >= cell) {
          const dir = accX > 0 ? 1 : -1;
          handlersRef.current.onMove(dir);
          accX -= dir * cell;
        }
      } else if (axis === 'v' && totalY > SOFT_DROP_START_DIST && !softDropping) {
        softDropping = true;
        handlersRef.current.onSoftDrop(true);
      }
    };

    const onTouchEnd = (): void => {
      if (!tracking) return;
      tracking = false;
      const duration = performance.now() - startTime;
      const totalX = lastX - startX;
      const totalY = lastY - startY;
      if (softDropping) {
        softDropping = false;
        handlersRef.current.onSoftDrop(false);
      }
      if (Math.hypot(totalX, totalY) <= TAP_MAX_DIST && duration <= TAP_MAX_MS) {
        const rect = element.getBoundingClientRect();
        handlersRef.current.onRotate(startX - rect.left < rect.width / 2 ? -1 : 1);
        return;
      }
      if (axis === 'v' && totalY >= FLICK_MIN_DIST && totalY / duration >= FLICK_MIN_VELOCITY) {
        handlersRef.current.onHardDrop();
      }
    };

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd);
    element.addEventListener('touchcancel', onTouchEnd);
    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchEnd);
      if (softDropping) handlersRef.current.onSoftDrop(false);
    };
  }, [ref]);
}
