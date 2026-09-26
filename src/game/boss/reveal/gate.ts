/**
 * PLAYER 2 cooperative gate (GAME_07_REVEAL_UI_SPEC §4–5). Pure and
 * deterministic: PLAYER 1 walks to the left switch; then PLAYER 2 follows a
 * fixed waypoint path to the right switch. It can never deadlock: PLAYER 2
 * snaps to the switch after `P2_FALLBACK_MS`, or at once with reduced motion.
 */
import type { Facing } from '../../world/types';

export const GATE_ARENA = { w: 640, h: 360 };
/** Walkable floor for PLAYER 1. */
export const FLOOR = { x: 120, y: 150, w: 400, h: 170 };
export const SWITCH_1 = { x: 250, y: 240 };
export const SWITCH_2 = { x: 390, y: 240 };
export const DOOR = { x: 290, y: 104, w: 60, h: 46 };
export const REACH = 26;
export const P1_SPEED = 96;
export const P2_SPEED = 72;
export const P1_START = { x: 250, y: 300 };
/** PLAYER 2 enters from the right edge of the floor. */
export const P2_PATH: readonly { x: number; y: number }[] = [
  { x: 500, y: 300 },
  { x: 470, y: 300 },
  { x: 470, y: 262 },
  { x: 390, y: 262 },
  { x: SWITCH_2.x, y: SWITCH_2.y },
];
export const P2_FALLBACK_MS = 6000;
const P2_READY_MS = 500;
const OPEN_MS = 900;

export type GateStage = 'await1' | 'p2walk' | 'p2ready' | 'opening' | 'open';

export interface GateState {
  stage: GateStage;
  t: number;
  /** When the current stage began. */
  since: number;
  p1: { x: number; y: number; facing: Facing };
  p2: { x: number; y: number; facing: Facing; leg: number };
}

export function createGate(): GateState {
  const start = P2_PATH[0]!;
  return {
    stage: 'await1',
    t: 0,
    since: 0,
    p1: { ...P1_START, facing: 'up' },
    p2: { ...start, facing: 'left', leg: 1 },
  };
}

export const switch1InReach = (s: GateState) =>
  s.stage === 'await1' && Math.hypot(s.p1.x - SWITCH_1.x, s.p1.y - SWITCH_1.y) <= REACH;

const STEP: Record<Facing, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function facingTo(dx: number, dy: number): Facing {
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

/** PLAYER 2 at the switch, path finished. */
function snapP2(s: GateState): GateState {
  return { ...s, p2: { ...SWITCH_2, facing: 'up', leg: P2_PATH.length } };
}

function walkP2(s: GateState, dt: number): GateState {
  let { x, y, facing, leg } = s.p2;
  let budget = (P2_SPEED * dt) / 1000;
  while (budget > 0 && leg < P2_PATH.length) {
    const to = P2_PATH[leg]!;
    const dx = to.x - x;
    const dy = to.y - y;
    const d = Math.hypot(dx, dy);
    if (d > 0) facing = facingTo(dx, dy);
    if (d <= budget) {
      x = to.x;
      y = to.y;
      budget -= d;
      leg += 1;
    } else {
      x += (dx / d) * budget;
      y += (dy / d) * budget;
      budget = 0;
    }
  }
  return { ...s, p2: { x, y, facing: leg >= P2_PATH.length ? 'up' : facing, leg } };
}

export interface GateInput {
  dir: Facing | null;
  interact: boolean;
  reduced: boolean;
}

export function advanceGate(prev: GateState, dtMs: number, input: GateInput): GateState {
  const dt = Math.min(Math.max(dtMs, 0), 50);
  let s: GateState = { ...prev, t: prev.t + dt };
  const since = s.t - s.since;

  // PLAYER 1 always moves (control returns); the door blocks nothing.
  if (input.dir) {
    const [dx, dy] = STEP[input.dir];
    const d = (P1_SPEED * dt) / 1000;
    s = {
      ...s,
      p1: {
        x: Math.min(Math.max(s.p1.x + dx * d, FLOOR.x), FLOOR.x + FLOOR.w),
        y: Math.min(Math.max(s.p1.y + dy * d, FLOOR.y), FLOOR.y + FLOOR.h),
        facing: input.dir,
      },
    };
  }

  switch (s.stage) {
    case 'await1':
      if (input.interact && switch1InReach(s)) {
        s = { ...s, stage: 'p2walk', since: s.t, p1: { ...s.p1, facing: 'up' } };
        if (input.reduced) s = snapP2(s);
      }
      break;
    case 'p2walk':
      s = input.reduced || since >= P2_FALLBACK_MS ? snapP2(s) : walkP2(s, dt);
      if (s.p2.leg >= P2_PATH.length) s = { ...s, stage: 'p2ready', since: s.t };
      break;
    case 'p2ready':
      if (since >= P2_READY_MS) s = { ...s, stage: 'opening', since: s.t };
      break;
    case 'opening':
      if (input.reduced || since >= OPEN_MS) {
        s = {
          ...s,
          stage: 'open',
          since: s.t,
          p1: { ...s.p1, facing: 'up' },
          p2: { ...s.p2, facing: 'up' },
        };
      }
      break;
    case 'open':
      break;
  }
  return s;
}

/** Status lines (locked copy) for the gate HUD. */
export function gateLines(s: GateState): string[] {
  switch (s.stage) {
    case 'await1':
      return ['PLAYER 1 INPUT REQUIRED'];
    case 'p2walk':
      return ['PLAYER 1 — READY'];
    case 'p2ready':
      return ['PLAYER 1 — READY', 'PLAYER 2 — READY'];
    case 'opening':
    case 'open':
      return ['2/2 PLAYERS — READY'];
  }
}
