export type SoundName =
  | 'move'
  | 'rotate'
  | 'hold'
  | 'lock'
  | 'hardDrop'
  | 'clear'
  | 'big'
  | 'levelUp'
  | 'gameOver'
  | 'start';

let audioContext: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

interface ToneOptions {
  type?: OscillatorType;
  volume?: number;
  slideTo?: number;
  delay?: number;
}

function tone(frequency: number, duration: number, options: ToneOptions = {}): void {
  const ctx = context();
  if (!ctx) return;
  const { type = 'square', volume = 0.12, slideTo, delay = 0 } = options;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), start + duration);
  }
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playSound(name: SoundName): void {
  if (muted) return;
  try {
    switch (name) {
      case 'move':
        tone(190, 0.03, { volume: 0.05 });
        break;
      case 'rotate':
        tone(330, 0.05, { volume: 0.07 });
        break;
      case 'hold':
        tone(260, 0.07, { type: 'sine', volume: 0.1 });
        break;
      case 'lock':
        tone(150, 0.07, { type: 'triangle', volume: 0.12 });
        break;
      case 'hardDrop':
        tone(240, 0.09, { type: 'sawtooth', volume: 0.1, slideTo: 70 });
        break;
      case 'clear':
        [440, 560, 660].forEach((f, i) => tone(f, 0.09, { volume: 0.1, delay: i * 0.06 }));
        break;
      case 'big':
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { volume: 0.12, delay: i * 0.07 }));
        break;
      case 'levelUp':
        [660, 880].forEach((f, i) =>
          tone(f, 0.12, { type: 'triangle', volume: 0.12, delay: i * 0.1 }),
        );
        break;
      case 'gameOver':
        tone(330, 0.5, { type: 'triangle', volume: 0.12, slideTo: 70 });
        break;
      case 'start':
        tone(523, 0.08, { volume: 0.08 });
        tone(784, 0.1, { volume: 0.08, delay: 0.09 });
        break;
      default:
        break;
    }
  } catch {
    return;
  }
}

export function vibrate(ms: number): void {
  if (muted) return;
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(ms);
  }
}
