import { PIECE_TYPES } from './types';
import type { PieceType } from './types';

function nextRandom(seed: number): [number, number] {
  const newSeed = (seed + 0x6d2b79f5) | 0;
  let t = newSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, newSeed];
}

export function drawBag(seed: number): [PieceType[], number] {
  const bag: PieceType[] = [...PIECE_TYPES];
  let s = seed;
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const [value, ns] = nextRandom(s);
    s = ns;
    const j = Math.floor(value * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return [bag, s];
}

export function refillQueue(
  queue: PieceType[],
  seed: number,
  minLength = 7,
): [PieceType[], number] {
  let next = queue;
  let s = seed;
  while (next.length < minLength) {
    const [bag, ns] = drawBag(s);
    next = [...next, ...bag];
    s = ns;
  }
  return [next, s];
}
