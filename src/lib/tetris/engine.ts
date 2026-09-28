import { refillQueue } from './bag';
import {
  COLS,
  HIDDEN_ROWS,
  ROWS,
  clearLines,
  collides,
  createBoard,
  ghostY,
  isBoardEmpty,
  merge,
  pieceCells,
} from './board';
import { SPAWN_X, SPAWN_Y } from './pieces';
import { tryRotate } from './srs';
import type {
  ActivePiece,
  GameAction,
  GameState,
  Rotation,
  TSpinKind,
} from './types';

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
const SOFT_DROP_FACTOR = 20;

const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800];
const TSPIN_POINTS = [400, 800, 1200, 1600, 1600];
const TSPIN_MINI_POINTS = [100, 200, 400, 400, 400];
const PERFECT_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];
const CLEAR_NAMES = ['', 'Single', 'Double', 'Triple', 'Tetris'];

export function gravityInterval(level: number): number {
  return Math.max(Math.pow(0.8 - (level - 1) * 0.007, level - 1) * 1000, 16);
}

export function createInitialState(): GameState {
  return {
    board: createBoard(),
    active: null,
    hold: null,
    holdUsed: false,
    queue: [],
    seed: 0,
    status: 'idle',
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    backToBack: false,
    softDropping: false,
    gravityAcc: 0,
    lockElapsed: 0,
    lockResets: 0,
    lastAction: null,
    lastKickIndex: -1,
    message: null,
  };
}

function spawnPiece(state: GameState): GameState {
  const [queue, seed] = refillQueue(state.queue, state.seed);
  const active: ActivePiece = { type: queue[0], rotation: 0, x: SPAWN_X, y: SPAWN_Y };
  return {
    ...state,
    queue: queue.slice(1),
    seed,
    active,
    status: collides(state.board, active) ? 'over' : state.status,
    gravityAcc: 0,
    lockElapsed: 0,
    lockResets: 0,
    lastAction: null,
    lastKickIndex: -1,
  };
}

function detectTSpin(state: GameState, piece: ActivePiece): TSpinKind {
  if (piece.type !== 'T' || state.lastAction !== 'rotate') return 'none';
  const occupied = (x: number, y: number): boolean =>
    x < 0 || x >= COLS || y < 0 || y >= ROWS || state.board[y][x] !== null;
  const corners = [
    occupied(piece.x, piece.y),
    occupied(piece.x + 2, piece.y),
    occupied(piece.x + 2, piece.y + 2),
    occupied(piece.x, piece.y + 2),
  ];
  const total = corners.filter(Boolean).length;
  if (total < 3) return 'none';
  const frontByRotation: Record<Rotation, [number, number]> = {
    0: [0, 1],
    1: [1, 2],
    2: [2, 3],
    3: [3, 0],
  };
  const [a, b] = frontByRotation[piece.rotation];
  const frontCount = Number(corners[a]) + Number(corners[b]);
  if (frontCount === 2 || state.lastKickIndex === 4) return 'full';
  return 'mini';
}

function lockPiece(state: GameState): GameState {
  if (!state.active) return state;
  const piece = state.active;
  const cells = pieceCells(piece);
  const lockOut = cells.every(([, y]) => y < HIDDEN_ROWS);
  const tSpin = detectTSpin(state, piece);
  const merged = merge(state.board, piece);
  const { board, cleared } = clearLines(merged);

  let points = 0;
  let b2bEligible = false;
  if (tSpin === 'full') {
    points = TSPIN_POINTS[cleared];
    b2bEligible = cleared > 0;
  } else if (tSpin === 'mini') {
    points = TSPIN_MINI_POINTS[cleared];
    b2bEligible = cleared > 0;
  } else {
    points = LINE_CLEAR_POINTS[cleared];
    b2bEligible = cleared === 4;
  }

  const b2bApplied = cleared > 0 && b2bEligible && state.backToBack;
  if (b2bApplied) points = Math.floor(points * 1.5);

  const combo = cleared > 0 ? state.combo + 1 : -1;
  if (combo > 0) points += 50 * combo;

  let score = state.score + points * state.level;
  const perfectClear = cleared > 0 && isBoardEmpty(board);
  if (perfectClear) score += PERFECT_CLEAR_POINTS[cleared] * state.level;

  const lines = state.lines + cleared;
  const level = Math.floor(lines / 10) + 1;
  const backToBack = cleared > 0 ? b2bEligible : state.backToBack;

  const parts: string[] = [];
  if (b2bApplied) parts.push('B2B');
  if (tSpin === 'full') parts.push('T-Spin');
  if (tSpin === 'mini') parts.push('T-Spin Mini');
  if (cleared > 0) parts.push(CLEAR_NAMES[cleared]);
  if (perfectClear) parts.push('Perfect Clear');
  if (combo > 0) parts.push(`Combo ×${combo}`);
  const message = parts.length > 0
    ? { id: (state.message?.id ?? 0) + 1, text: `${parts.join(' ')}!` }
    : state.message;

  const next: GameState = {
    ...state,
    board,
    score,
    lines,
    level,
    combo,
    backToBack,
    holdUsed: false,
    message,
  };
  if (lockOut) return { ...next, active: null, status: 'over' };
  return spawnPiece(next);
}

function tick(state: GameState, delta: number): GameState {
  if (!state.active) return state;
  let piece = state.active;
  const interval = state.softDropping
    ? Math.min(gravityInterval(state.level) / SOFT_DROP_FACTOR, 50)
    : gravityInterval(state.level);
  let gravityAcc = state.gravityAcc + delta;
  let score = state.score;
  let lockElapsed = state.lockElapsed;
  let lockResets = state.lockResets;
  let lastAction = state.lastAction;
  let fell = false;

  while (gravityAcc >= interval) {
    gravityAcc -= interval;
    const moved = { ...piece, y: piece.y + 1 };
    if (collides(state.board, moved)) break;
    piece = moved;
    fell = true;
    if (state.softDropping) score += 1;
  }
  if (fell) {
    lockElapsed = 0;
    lockResets = 0;
    lastAction = 'move';
  }

  const grounded = collides(state.board, { ...piece, y: piece.y + 1 });
  if (grounded) {
    gravityAcc = Math.min(gravityAcc, interval);
    lockElapsed += delta;
    if (lockElapsed >= LOCK_DELAY_MS || lockResets >= MAX_LOCK_RESETS) {
      return lockPiece({ ...state, active: piece, score, lastAction, gravityAcc: 0, lockElapsed, lockResets });
    }
  } else {
    lockElapsed = 0;
  }
  return { ...state, active: piece, score, gravityAcc, lockElapsed, lockResets, lastAction };
}

function moveActive(state: GameState, dx: -1 | 1): GameState {
  if (!state.active) return state;
  const moved = { ...state.active, x: state.active.x + dx };
  if (collides(state.board, moved)) return state;
  const grounded = collides(state.board, { ...moved, y: moved.y + 1 });
  let lockElapsed = state.lockElapsed;
  let lockResets = state.lockResets;
  if (grounded && lockResets < MAX_LOCK_RESETS) {
    lockElapsed = 0;
    lockResets += 1;
  }
  return { ...state, active: moved, lastAction: 'move', lockElapsed, lockResets };
}

function rotateActive(state: GameState, dir: 1 | -1): GameState {
  if (!state.active) return state;
  const result = tryRotate(state.board, state.active, dir);
  if (!result) return state;
  const grounded = collides(state.board, { ...result.piece, y: result.piece.y + 1 });
  let lockElapsed = state.lockElapsed;
  let lockResets = state.lockResets;
  if (grounded && lockResets < MAX_LOCK_RESETS) {
    lockElapsed = 0;
    lockResets += 1;
  }
  return {
    ...state,
    active: result.piece,
    lastAction: 'rotate',
    lastKickIndex: result.kickIndex,
    lockElapsed,
    lockResets,
  };
}

function hardDrop(state: GameState): GameState {
  if (!state.active) return state;
  const y = ghostY(state.board, state.active);
  const distance = y - state.active.y;
  return lockPiece({
    ...state,
    active: { ...state.active, y },
    score: state.score + distance * 2,
    lastAction: distance > 0 ? 'move' : state.lastAction,
  });
}

function holdActive(state: GameState): GameState {
  if (!state.active || state.holdUsed) return state;
  const held = state.active.type;
  if (state.hold === null) {
    return { ...spawnPiece(state), hold: held, holdUsed: true };
  }
  const active: ActivePiece = { type: state.hold, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
  return {
    ...state,
    active,
    hold: held,
    holdUsed: true,
    status: collides(state.board, active) ? 'over' : state.status,
    gravityAcc: 0,
    lockElapsed: 0,
    lockResets: 0,
    lastAction: null,
    lastKickIndex: -1,
  };
}

function startGame(seed: number): GameState {
  return spawnPiece({ ...createInitialState(), seed, status: 'playing' });
}

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      return startGame(action.seed);
    case 'togglePause':
      if (state.status === 'playing') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'playing' };
      return state;
    case 'softDrop':
      return { ...state, softDropping: action.on };
    default:
      break;
  }
  if (state.status !== 'playing') return state;
  switch (action.type) {
    case 'tick':
      return tick(state, action.delta);
    case 'move':
      return moveActive(state, action.dx);
    case 'rotate':
      return rotateActive(state, action.dir);
    case 'hardDrop':
      return hardDrop(state);
    case 'hold':
      return holdActive(state);
    default:
      return state;
  }
}
