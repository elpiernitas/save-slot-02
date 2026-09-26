/**
 * PZ-02 SYNC TERMINAL — pure state (GAME_06_SPEC §11).
 *
 * PLAYER 1's channel is three pipe tiles on a small grid. Each tile rotates
 * in 90° steps; the channel is synced when a path runs from the source (left
 * of tile A) to the output (below tile C). PLAYER 2's channel is never
 * playable. After the sync the terminal walks through a fixed sequence that
 * ends in the degraded fallback; only then is the puzzle complete.
 */
export type Side = 'n' | 'e' | 's' | 'w';
export type TileKind = 'straight' | 'corner';

export interface Tile {
  kind: TileKind;
  /** Quarter turns clockwise, 0–3. */
  rot: number;
  /** Grid cell (column, row). */
  col: number;
  row: number;
}

export type TerminalPhase =
  /** PLAYER 1 channel is being connected; Escape leaves. */
  | 'solving'
  | 'p1Synced'
  | 'p2Check'
  /** Waiting for the one confirm that applies the fallback. */
  | 'fallback'
  | 'recovering'
  | 'done';

export interface TerminalState {
  tiles: readonly Tile[];
  cursor: number;
  phase: TerminalPhase;
}

const SIDES: readonly Side[] = ['n', 'e', 's', 'w'];
const OPPOSITE: Record<Side, Side> = { n: 's', e: 'w', s: 'n', w: 'e' };
const STEP: Record<Side, [number, number]> = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };

/** Unrotated openings: straight = west–east, corner = north–east. */
const BASE: Record<TileKind, readonly Side[]> = { straight: ['w', 'e'], corner: ['n', 'e'] };

/** Where the current flows in and out (fixed hardware). */
export const SOURCE = { tile: 0, side: 'w' as Side };
export const OUTPUT = { tile: 2, side: 's' as Side };

export function openings(tile: Tile): Side[] {
  return BASE[tile.kind].map((side) => SIDES[(SIDES.indexOf(side) + tile.rot) % 4]!);
}

export function initialTerminal(): TerminalState {
  return {
    // A (straight) and C (straight) start crossed, B (corner) points away.
    tiles: [
      { kind: 'straight', rot: 1, col: 0, row: 0 },
      { kind: 'corner', rot: 0, col: 1, row: 0 },
      { kind: 'straight', rot: 0, col: 1, row: 1 },
    ],
    cursor: 0,
    phase: 'solving',
  };
}

const tileAt = (tiles: readonly Tile[], col: number, row: number) =>
  tiles.findIndex((t) => t.col === col && t.row === row);

/** Indices of tiles the current reaches from the source, in order. */
export function poweredTiles(tiles: readonly Tile[]): number[] {
  const path: number[] = [];
  let index = SOURCE.tile;
  let entry: Side = SOURCE.side;
  while (index >= 0 && !path.includes(index)) {
    const tile = tiles[index]!;
    const open = openings(tile);
    if (!open.includes(entry)) break;
    path.push(index);
    const exit = open.find((side) => side !== entry)!;
    if (index === OUTPUT.tile && exit === OUTPUT.side) return path;
    const [dx, dy] = STEP[exit];
    index = tileAt(tiles, tile.col + dx, tile.row + dy);
    entry = OPPOSITE[exit];
  }
  return path;
}

export function isChannelSynced(tiles: readonly Tile[]): boolean {
  const path = poweredTiles(tiles);
  const last = path.at(-1);
  if (last !== OUTPUT.tile) return false;
  return openings(tiles[last]!).includes(OUTPUT.side) && path.length === tiles.length;
}

export type TerminalAction =
  | { type: 'move'; dir: Side }
  | { type: 'select'; tile: number }
  | { type: 'rotate'; tile?: number }
  /** Advances the post-sync sequence (timers and the final confirm). */
  | { type: 'advance' };

export function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case 'move': {
      if (state.phase !== 'solving') return state;
      const tile = state.tiles[state.cursor]!;
      const [dx, dy] = STEP[action.dir];
      const next = tileAt(state.tiles, tile.col + dx, tile.row + dy);
      return next < 0 ? state : { ...state, cursor: next };
    }
    case 'select':
      if (state.phase !== 'solving' || !state.tiles[action.tile]) return state;
      return { ...state, cursor: action.tile };
    case 'rotate': {
      if (state.phase !== 'solving') return state;
      const index = action.tile ?? state.cursor;
      if (!state.tiles[index]) return state;
      const tiles = state.tiles.map((t, i) => (i === index ? { ...t, rot: (t.rot + 1) % 4 } : t));
      return {
        ...state,
        tiles,
        cursor: index,
        phase: isChannelSynced(tiles) ? 'p1Synced' : 'solving',
      };
    }
    case 'advance': {
      const order: TerminalPhase[] = ['p1Synced', 'p2Check', 'fallback', 'recovering', 'done'];
      const at = order.indexOf(state.phase);
      if (at < 0 || at === order.length - 1) return state;
      return { ...state, phase: order[at + 1]! };
    }
  }
}

/** Escape leaves only before the final lock (GAME_06_SPEC §11). */
export const canLeave = (state: TerminalState) => state.phase === 'solving';
