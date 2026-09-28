import { useEffect, useRef } from 'react';

const DAS_MS = 167;
const ARR_MS = 33;

export interface KeyboardHandlers {
  onMove: (dx: -1 | 1) => void;
  onRotate: (dir: 1 | -1) => void;
  onSoftDrop: (on: boolean) => void;
  onHardDrop: () => void;
  onHold: () => void;
  onPause: () => void;
  onStart: () => void;
  onRestart: () => void;
}

export function useKeyboard(handlers: KeyboardHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let dasTimer: number | null = null;
    let arrTimer: number | null = null;
    let activeDir: -1 | 1 | null = null;
    const pressed = { left: false, right: false };

    const stopAutoShift = (): void => {
      if (dasTimer !== null) {
        window.clearTimeout(dasTimer);
        dasTimer = null;
      }
      if (arrTimer !== null) {
        window.clearInterval(arrTimer);
        arrTimer = null;
      }
      activeDir = null;
    };

    const startAutoShift = (dir: -1 | 1): void => {
      stopAutoShift();
      activeDir = dir;
      handlersRef.current.onMove(dir);
      dasTimer = window.setTimeout(() => {
        arrTimer = window.setInterval(() => handlersRef.current.onMove(dir), ARR_MS);
      }, DAS_MS);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      switch (event.code) {
        case 'ArrowLeft':
          event.preventDefault();
          if (event.repeat) return;
          pressed.left = true;
          startAutoShift(-1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (event.repeat) return;
          pressed.right = true;
          startAutoShift(1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (event.repeat) return;
          handlersRef.current.onSoftDrop(true);
          break;
        case 'Space':
          event.preventDefault();
          if (event.repeat) return;
          handlersRef.current.onHardDrop();
          break;
        case 'ArrowUp':
        case 'KeyX':
          event.preventDefault();
          if (event.repeat) return;
          handlersRef.current.onRotate(1);
          break;
        case 'KeyZ':
          if (event.repeat) return;
          handlersRef.current.onRotate(-1);
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          if (event.repeat) return;
          handlersRef.current.onHold();
          break;
        case 'KeyP':
        case 'Escape':
          if (event.repeat) return;
          handlersRef.current.onPause();
          break;
        case 'Enter':
          if (event.repeat) return;
          handlersRef.current.onStart();
          break;
        case 'KeyR':
          if (event.repeat) return;
          handlersRef.current.onRestart();
          break;
        default:
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      switch (event.code) {
        case 'ArrowLeft':
          pressed.left = false;
          if (activeDir === -1) {
            if (pressed.right) startAutoShift(1);
            else stopAutoShift();
          }
          break;
        case 'ArrowRight':
          pressed.right = false;
          if (activeDir === 1) {
            if (pressed.left) startAutoShift(-1);
            else stopAutoShift();
          }
          break;
        case 'ArrowDown':
          handlersRef.current.onSoftDrop(false);
          break;
        default:
          break;
      }
    };

    const onBlur = (): void => {
      stopAutoShift();
      pressed.left = false;
      pressed.right = false;
      handlersRef.current.onSoftDrop(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      stopAutoShift();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
}
