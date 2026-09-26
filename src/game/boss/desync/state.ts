/**
 * DESYNC PROCESS — pure encounter state (GAME_07_BOSS_PATTERN_SPEC).
 *
 * Deterministic: time comes in as `dt` (ms), input as a small snapshot, and
 * the hazard sequence is authored data (no RNG). The scene owns the RAF loop,
 * input, audio and save dispatches; this module only decides what happens.
 */
import type { Facing } from '../../world/types';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Logical arena (640×360) and the safe playable rectangle. */
export const ARENA = { w: 640, h: 360 };
export const SAFE: Rect = { x: 88, y: 58, w: 464, h: 248 };

export const PLAYER_SPEED = 112; // px/s
/** Collision footprint (smaller than the visible body), centred on the feet. */
export const FOOT = { w: 14, h: 10 };
export const START = { x: 320, y: 236 };

export type NodeId = 'a' | 'b' | 'c';
export const NODES: Readonly<Record<NodeId, { x: number; y: number }>> = {
  a: { x: 170, y: 110 },
  b: { x: 470, y: 110 },
  c: { x: 320, y: 280 },
};
export const CORE = { x: 320, y: 182 };
export const REACH = 34;
export const COMMITS_PER_NODE = 3;
export const COMMIT_LOCK_MS = 300;
export const INVULNERABLE_MS = 1000;
export const BANNER_MS = 1500;

/** Warning lead / danger active / recovery gap (spec §4). */
const TIMING = { telegraph: 700, active: 650, recovery: 450 };
export const ASSIST_TELEGRAPH = 1.3;

export type Hazard =
  /** A lane that the barrier slides into (chevrons show the direction). */
  | { kind: 'sweep'; lane: Rect; dir: 'right' | 'left' | 'down' }
  | { kind: 'pulse'; zones: readonly Rect[] }
  /** Zones placed from the player's position when the step begins (no RNG). */
  | { kind: 'pulseBiased' }
  /** Final ring: beat 1 = centre disc, beat 2 = outer band. */
  | { kind: 'ring'; beat: 1 | 2 };

export const RING = { inner: 92, outer: 200 };

const fullH = (x: number, w: number): Rect => ({ x, y: SAFE.y, w, h: SAFE.h });
const fullW = (y: number, h: number): Rect => ({ x: SAFE.x, y, w: SAFE.w, h });

/** Authored release sequences (spec §7). Phases 1–2 loop; phase 3 runs once. */
export const PATTERNS = {
  checksum: [
    { kind: 'sweep', lane: fullH(200, 96), dir: 'right' },
    {
      kind: 'pulse',
      zones: [
        { x: 360, y: 70, w: 150, h: 100 },
        { x: 110, y: 210, w: 150, h: 90 },
      ],
    },
    { kind: 'sweep', lane: fullW(72, 80), dir: 'down' },
  ],
  split: [
    {
      kind: 'pulse',
      zones: [
        { x: 100, y: 62, w: 140, h: 90 },
        { x: 400, y: 62, w: 140, h: 90 },
        { x: 250, y: 222, w: 140, h: 84 },
      ],
    },
    { kind: 'sweep', lane: fullH(380, 96), dir: 'left' },
    { kind: 'pulseBiased' },
    { kind: 'sweep', lane: fullH(250, 96), dir: 'right' },
  ],
  missing: [
    { kind: 'ring', beat: 1 },
    { kind: 'ring', beat: 2 },
    {
      kind: 'pulse',
      zones: [
        { x: 100, y: 62, w: 130, h: 90 },
        { x: 410, y: 214, w: 130, h: 90 },
      ],
    },
  ],
} as const satisfies Record<string, readonly Hazard[]>;

export type Phase = 'checksum' | 'split' | 'missing';
export type Status = 'playing' | 'failed' | 'complete';

export interface DesyncState {
  status: Status;
  phase: Phase;
  /** Ms since the attempt started. */
  t: number;
  /** Between phases: no hazards while a SYSTEM banner shows. */
  banner: { text: string; until: number; next?: Phase } | null;
  /** Index in the phase pattern; `stepCount` is a global counter (commit gate). */
  step: number;
  stepCount: number;
  stepStart: number;
  /** Player snapshot taken when a biased pulse step begins. */
  biasFrom: { x: number; y: number } | null;
  integrity: number;
  invulnerableUntil: number;
  nodes: Record<NodeId, number>;
  /** Last stepCount in which each node accepted a commit (one per cycle). */
  committedAt: Record<NodeId, number>;
  lockedUntil: number;
  /** Phase 3: the core activates once the final sequence has run. */
  coreActive: boolean;
  player: { x: number; y: number; facing: Facing };
  assist: boolean;
  /** Short-lived SYSTEM line for the HUD (e.g. "1 CHANNEL REMAINS"). */
  notice: { text: string; until: number } | null;
}

export interface BossInput {
  dir: Facing | null;
  /** True on the frame the interact key was pressed (edge). */
  interact: boolean;
}

export function createAttempt(options: { assist?: boolean } = {}): DesyncState {
  return {
    status: 'playing',
    phase: 'checksum',
    t: 0,
    banner: { text: 'EL CHECKSUM NO COINCIDE', until: BANNER_MS },
    step: 0,
    stepCount: 0,
    stepStart: BANNER_MS,
    biasFrom: null,
    integrity: 3,
    invulnerableUntil: 0,
    nodes: { a: 0, b: 0, c: 0 },
    committedAt: { a: -1, b: -1, c: -1 },
    lockedUntil: 0,
    coreActive: false,
    player: { ...START, facing: 'up' },
    assist: options.assist ?? false,
    notice: null,
  };
}

export const PHASE_NODES: Readonly<Record<Phase, readonly NodeId[]>> = {
  checksum: ['a'],
  split: ['b', 'c'],
  missing: [],
};

export function timing(assist: boolean) {
  return { ...TIMING, telegraph: Math.round(TIMING.telegraph * (assist ? ASSIST_TELEGRAPH : 1)) };
}

const stepLength = (assist: boolean) => {
  const t = timing(assist);
  return t.telegraph + t.active + t.recovery;
};

const phaseDone = (s: DesyncState) =>
  s.phase === 'missing'
    ? s.coreActive
    : PHASE_NODES[s.phase].every((n) => s.nodes[n] >= COMMITS_PER_NODE);

export type HazardStage = 'telegraph' | 'active' | 'recovery';

export interface HazardView {
  hazard: Hazard;
  stage: HazardStage;
  /** Collision/telegraph shapes for this step (resolved biased zones). */
  rects: Rect[];
  ring: { inner: number; outer: number } | null;
}

function clampRect(r: Rect): Rect {
  const x = Math.min(Math.max(r.x, SAFE.x), SAFE.x + SAFE.w - r.w);
  const y = Math.min(Math.max(r.y, SAFE.y), SAFE.y + SAFE.h - r.h);
  return { ...r, x, y };
}

/** Biased pulse: one zone on the snapshot, one mirrored across the centre. */
export function biasedZones(from: { x: number; y: number }): Rect[] {
  const w = 130;
  const h = 96;
  const here = clampRect({
    x: Math.round(from.x - w / 2),
    y: Math.round(from.y - h / 2 - 5),
    w,
    h,
  });
  const mirror = clampRect({
    x: Math.round(ARENA.w - from.x - w / 2),
    y: Math.round(ARENA.h - 60 - from.y - h / 2),
    w,
    h,
  });
  return [here, mirror];
}

/** The hazard of the current step, if any (none during banners or after phase 3). */
export function currentHazard(s: DesyncState): HazardView | null {
  if (s.banner || s.status !== 'playing') return null;
  const list: readonly Hazard[] = PATTERNS[s.phase];
  if (s.phase === 'missing' && s.step >= list.length) return null;
  const hazard = list[s.step % list.length]!;
  const t = timing(s.assist);
  const local = s.t - s.stepStart;
  const stage: HazardStage =
    local < t.telegraph ? 'telegraph' : local < t.telegraph + t.active ? 'active' : 'recovery';
  if (hazard.kind === 'ring') {
    const ring = hazard.beat === 1 ? { inner: 0, outer: RING.inner } : RING;
    return { hazard, stage, rects: [], ring };
  }
  const rects =
    hazard.kind === 'sweep'
      ? [hazard.lane]
      : hazard.kind === 'pulse'
        ? [...hazard.zones]
        : biasedZones(s.biasFrom ?? s.player);
  return { hazard, stage, rects, ring: null };
}

export const footRect = (p: { x: number; y: number }): Rect => ({
  x: p.x - FOOT.w / 2,
  y: p.y - FOOT.h,
  w: FOOT.w,
  h: FOOT.h,
});

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Is the player inside the active danger of this hazard view? */
export function hitBy(view: HazardView, player: { x: number; y: number }): boolean {
  if (view.stage !== 'active') return false;
  if (view.ring) {
    const d = Math.hypot(player.x - CORE.x, player.y - FOOT.h / 2 - CORE.y);
    return d >= view.ring.inner && d < view.ring.outer;
  }
  const foot = footRect(player);
  return view.rects.some((r) => overlaps(foot, r));
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/** The node PLAYER 1 can stabilise from here right now, if any. */
export function nodeInReach(s: DesyncState): NodeId | null {
  if (s.banner || s.status !== 'playing') return null;
  for (const id of PHASE_NODES[s.phase]) {
    if (s.nodes[id] < COMMITS_PER_NODE && dist(s.player, NODES[id]) <= REACH) return id;
  }
  return null;
}

export const coreInReach = (s: DesyncState) =>
  s.status === 'playing' && !s.banner && s.coreActive && dist(s.player, CORE) <= REACH;

/** Can the node accept a commit now (once per hazard cycle, not while locked)? */
export const nodeReady = (s: DesyncState, id: NodeId) =>
  s.committedAt[id] !== s.stepCount && s.t >= s.lockedUntil;

const STEP: Record<Facing, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const PHASE_AFTER: Record<Phase, { done: string; next: Phase | null; title: string }> = {
  checksum: { done: 'NODO A — ESTABLE', next: 'split', title: 'SEÑAL DIVIDIDA' },
  split: { done: 'SEÑAL DE PLAYER 1 — ESTABLE', next: 'missing', title: 'CANAL PERDIDO' },
  missing: { done: '', next: null, title: '' },
};

/** One frame. `dt` is clamped so a slow frame can never skip a whole danger window. */
export function advanceBoss(prev: DesyncState, dtMs: number, input: BossInput): DesyncState {
  if (prev.status !== 'playing') return prev;
  const dt = Math.min(Math.max(dtMs, 0), 50);
  let s: DesyncState = { ...prev, t: prev.t + dt };
  if (s.notice && s.t >= s.notice.until) s = { ...s, notice: null };

  // Banners between phases: no hazards, no commits; movement allowed.
  if (s.banner) {
    if (s.t >= s.banner.until) {
      const next = s.banner.next;
      s = next
        ? {
            ...s,
            phase: next,
            banner: { text: PHASE_AFTER[s.phase].title, until: s.t + BANNER_MS },
            step: 0,
          }
        : { ...s, banner: null, stepStart: s.t, stepCount: s.stepCount + 1 };
    }
    return move(s, dt, input);
  }

  // Step scheduling.
  const length = stepLength(s.assist);
  if (s.t - s.stepStart >= length) {
    const finished = {
      ...s,
      step: s.step + 1,
      stepStart: s.stepStart + length,
      stepCount: s.stepCount + 1,
    };
    s = finished;
    if (s.phase !== 'missing' && phaseDone(s)) {
      // Objective met: phase ends once the current hazard has resolved.
      const after = PHASE_AFTER[s.phase];
      s = { ...s, banner: { text: after.done, until: s.t + BANNER_MS, next: after.next! } };
      return move(s, dt, input);
    }
    if (s.phase === 'missing' && s.step >= PATTERNS.missing.length) s = { ...s, coreActive: true };
  }
  const view = currentHazard(s);
  if (view?.hazard.kind === 'pulseBiased' && s.biasFrom === null) {
    s = { ...s, biasFrom: { x: Math.round(s.player.x), y: Math.round(s.player.y) } };
  } else if (view?.hazard.kind !== 'pulseBiased' && s.biasFrom !== null) {
    s = { ...s, biasFrom: null };
  }

  s = move(s, dt, input);

  // Interaction: stabilise a node or recover input at the core.
  if (input.interact) {
    if (coreInReach(s)) return { ...s, status: 'complete' };
    const node = nodeInReach(s);
    if (node && nodeReady(s, node)) {
      const nodes = { ...s.nodes, [node]: s.nodes[node] + 1 };
      s = {
        ...s,
        nodes,
        committedAt: { ...s.committedAt, [node]: s.stepCount },
        lockedUntil: s.t + COMMIT_LOCK_MS,
      };
      if (s.phase === 'split' && nodes[node] === COMMITS_PER_NODE) {
        const other = node === 'b' ? 'c' : 'b';
        if (nodes[other] < COMMITS_PER_NODE) {
          s = { ...s, notice: { text: 'QUEDA 1 CANAL', until: s.t + 2000 } };
        }
      }
    }
  }

  // Damage.
  const danger = currentHazard(s);
  if (danger && s.t >= s.invulnerableUntil && hitBy(danger, s.player)) {
    const integrity = s.integrity - 1;
    s = { ...s, integrity, invulnerableUntil: s.t + INVULNERABLE_MS };
    if (integrity <= 0) s = { ...s, status: 'failed' };
  }
  return s;
}

function move(s: DesyncState, dt: number, input: BossInput): DesyncState {
  if (!input.dir || s.t < s.lockedUntil) return s;
  const [dx, dy] = STEP[input.dir];
  const d = (PLAYER_SPEED * dt) / 1000;
  const x = Math.min(
    Math.max(s.player.x + dx * d, SAFE.x + FOOT.w / 2),
    SAFE.x + SAFE.w - FOOT.w / 2,
  );
  const y = Math.min(Math.max(s.player.y + dy * d, SAFE.y + FOOT.h), SAFE.y + SAFE.h);
  return { ...s, player: { x, y, facing: input.dir } };
}
