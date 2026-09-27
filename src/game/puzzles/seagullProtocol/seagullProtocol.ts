/**
 * PZ-03 PROTOCOLO DE LA GAVIOTA (MG-01, short version). Pure state.
 *
 * A 5×3 patch of La Muralla's paving. The seagull's shadow marks tiles
 * (telegraph), then it dives (strike). PLAYER 1 steps tile to tile out of
 * the marked ones. Survive the six dives of the fixed pattern. A hit does not
 * kill: the run restarts. After two failed runs the warnings last longer
 * (assist); after four the seagull loses interest and the puzzle completes,
 * so it can never block the story.
 */
export const COLS = 5;
export const ROWS = 3;
export type Tile = readonly [col: number, row: number];

/** Fixed, readable pattern: every dive leaves a safe tile within reach. */
export const DIVES: readonly (readonly Tile[])[] = [
  [
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [
    [1, 0],
    [2, 0],
    [3, 0],
    [1, 2],
    [2, 2],
    [3, 2],
  ],
  [
    [3, 0],
    [3, 1],
    [3, 2],
    [4, 0],
    [4, 1],
    [4, 2],
  ],
  [
    [0, 0],
    [2, 0],
    [4, 0],
    [1, 1],
    [3, 1],
    [0, 2],
    [2, 2],
    [4, 2],
  ],
  // The big one: everything but three tiles.
  (() => {
    const safe = ['0,0', '2,1', '4,2'];
    const all: Tile[] = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (!safe.includes(`${c},${r}`)) all.push([c, r]);
    return all;
  })(),
];

export const TIMING = { ready: 900, telegraph: 1150, strike: 380, gap: 420, hit: 1100 } as const;
export const ASSIST_TELEGRAPH = 1800;
export const ASSIST_AFTER = 2;
export const FALLBACK_AFTER = 4;
export const START: Tile = [2, 1];

export type Phase =
  | 'ready'
  | 'telegraph'
  | 'strike'
  | 'gap'
  /** Pecked: brief pause, then the run restarts from dive 1. */
  | 'hit'
  /** Six dives survived. */
  | 'cleared'
  /** Too many failures: the seagull loses interest (also completes). */
  | 'bored';

export interface SeagullState {
  phase: Phase;
  /** Index of the current dive. */
  dive: number;
  /** Time spent in the current phase (ms). */
  t: number;
  pos: Tile;
  failures: number;
  assist: boolean;
}

export const initialSeagull = (failures = 0): SeagullState => ({
  phase: 'ready',
  dive: 0,
  t: 0,
  pos: START,
  failures,
  assist: failures >= ASSIST_AFTER,
});

export const isDone = (s: SeagullState) => s.phase === 'cleared' || s.phase === 'bored';
export const telegraphMs = (s: SeagullState) => (s.assist ? ASSIST_TELEGRAPH : TIMING.telegraph);

const onTile = (tiles: readonly Tile[], [c, r]: Tile) => tiles.some(([x, y]) => x === c && y === r);

/** Tiles marked by the current dive (while it is announced or striking). */
export function markedTiles(s: SeagullState): readonly Tile[] {
  return s.phase === 'telegraph' || s.phase === 'strike' ? DIVES[s.dive]! : [];
}

const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
export type Dir = keyof typeof DIR;

/** One step; only while the dives are running (not during a peck or the end). */
export function moveSeagull(s: SeagullState, dir: Dir): SeagullState {
  if (!['ready', 'telegraph', 'gap'].includes(s.phase)) return s;
  const [dc, dr] = DIR[dir];
  const c = Math.min(COLS - 1, Math.max(0, s.pos[0] + dc));
  const r = Math.min(ROWS - 1, Math.max(0, s.pos[1] + dr));
  return c === s.pos[0] && r === s.pos[1] ? s : { ...s, pos: [c, r] };
}

/** Advances time (dt clamped for frame hitches). */
export function advanceSeagull(prev: SeagullState, dtMs: number): SeagullState {
  if (isDone(prev)) return prev;
  const s = { ...prev, t: prev.t + Math.min(Math.max(dtMs, 0), 60) };
  const next = (phase: Phase, extra: Partial<SeagullState> = {}): SeagullState => ({
    ...s,
    ...extra,
    phase,
    t: 0,
  });
  switch (s.phase) {
    case 'ready':
      return s.t >= TIMING.ready ? next('telegraph') : s;
    case 'telegraph':
      if (s.t < telegraphMs(s)) return s;
      // The dive lands: standing on a marked tile is a peck.
      if (onTile(DIVES[s.dive]!, s.pos)) {
        const failures = s.failures + 1;
        if (failures >= FALLBACK_AFTER) return next('bored', { failures });
        return next('hit', { failures, assist: failures >= ASSIST_AFTER });
      }
      return next('strike');
    case 'strike':
      return s.t >= TIMING.strike ? next('gap') : s;
    case 'gap':
      if (s.t < TIMING.gap) return s;
      return s.dive + 1 >= DIVES.length ? next('cleared') : next('telegraph', { dive: s.dive + 1 });
    case 'hit':
      return s.t >= TIMING.hit ? { ...initialSeagull(s.failures), phase: 'ready' } : s;
    default:
      return s;
  }
}
