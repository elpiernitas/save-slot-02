/**
 * MG-01 PROTOCOLO DE LA GAVIOTA.
 *
 * A tiny deterministic memory/position microgame. The shadow briefly marks a
 * tile, then Luis has to move to it and confirm before the next dive. The
 * state contains no timers or browser objects, so the UI can animate it while
 * tests exercise every transition directly.
 */
export const SEAGULL_GRID = { columns: 5, rows: 3 } as const;
export const SEAGULL_DIVES = 6;
export const SEAGULL_ASSIST_AFTER = 4;

/** Stable authored pattern: no random failure and no frame-count timing. */
export const SEAGULL_PATTERN: readonly number[] = [0, 7, 14, 3, 11, 6];

export type SeagullPhase = 'preview' | 'playing' | 'success';

export interface SeagullState {
  phase: SeagullPhase;
  cursor: number;
  target: number;
  dive: number;
  misses: number;
  assisted: boolean;
}

export function initialSeagull(): SeagullState {
  return {
    phase: 'preview',
    cursor: 0,
    target: SEAGULL_PATTERN[0]!,
    dive: 0,
    misses: 0,
    assisted: false,
  };
}

export function previewDone(state: SeagullState): SeagullState {
  return state.phase === 'preview' ? { ...state, phase: 'playing' } : state;
}

export type SeagullDirection = 'up' | 'down' | 'left' | 'right';

export function moveSeagull(state: SeagullState, direction: SeagullDirection): SeagullState {
  if (state.phase !== 'playing') return state;
  const row = Math.floor(state.cursor / SEAGULL_GRID.columns);
  const column = state.cursor % SEAGULL_GRID.columns;
  const nextRow = direction === 'up' ? row - 1 : direction === 'down' ? row + 1 : row;
  const nextColumn =
    direction === 'left' ? column - 1 : direction === 'right' ? column + 1 : column;
  if (
    nextRow < 0 ||
    nextRow >= SEAGULL_GRID.rows ||
    nextColumn < 0 ||
    nextColumn >= SEAGULL_GRID.columns
  )
    return state;
  return { ...state, cursor: nextRow * SEAGULL_GRID.columns + nextColumn };
}

/**
 * Confirm the current tile. A wrong dive resets the current position but does
 * not punish the player with a game-over. After four misses the bird loses
 * interest and the route is resolved automatically.
 */
export function dive(state: SeagullState): SeagullState {
  if (state.phase !== 'playing') return state;
  if (state.cursor !== state.target) {
    const misses = state.misses + 1;
    return misses >= SEAGULL_ASSIST_AFTER
      ? { ...state, misses, assisted: true, phase: 'success' }
      : { ...state, misses, cursor: 0 };
  }

  const dive = state.dive + 1;
  if (dive >= SEAGULL_DIVES) return { ...state, dive, phase: 'success' };
  return {
    ...state,
    dive,
    target: SEAGULL_PATTERN[dive]!,
    cursor: 0,
    phase: 'preview',
  };
}

export function seagullComplete(state: SeagullState): boolean {
  return state.phase === 'success';
}

export function seagullProgress(state: SeagullState): string {
  return `${Math.min(state.dive, SEAGULL_DIVES)}/${SEAGULL_DIVES}`;
}
