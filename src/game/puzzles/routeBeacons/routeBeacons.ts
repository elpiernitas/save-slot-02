/**
 * PZ-01 ROUTE BEACONS — pure state (GAME_06_SPEC §9, PUZZLE_BIBLE).
 *
 * Three ordinary objects act as route beacons, each marked with a symbol.
 * The order is shown once as a pulse (replayable at the route node); the
 * player walks to each beacon and syncs it. A wrong beacon resets progress
 * and counts an attempt (runtime only). Hints never shame and only appear
 * after failures.
 */
export type BeaconSymbol = 'cup' | 'lamp' | 'bird';

export interface BeaconState {
  sequence: readonly BeaconSymbol[];
  /** How many beacons of the sequence are synced (0–3). */
  progress: number;
  /** Runtime attempts: 1 + wrong beacons so far. Stored only on completion. */
  attempts: number;
  solved: boolean;
}

export const SYMBOL_LABEL: Readonly<Record<BeaconSymbol, string>> = {
  cup: 'CUP',
  lamp: 'LAMP',
  bird: 'BIRD',
};

export const ROUTE_SEQUENCE: readonly BeaconSymbol[] = ['cup', 'lamp', 'bird'];

export function initialBeacons(sequence: readonly BeaconSymbol[] = ROUTE_SEQUENCE): BeaconState {
  return { sequence, progress: 0, attempts: 1, solved: false };
}

export type BeaconOutcome = 'synced' | 'rejected' | 'solved' | 'ignored';

export function activateBeacon(
  state: BeaconState,
  symbol: BeaconSymbol,
): { state: BeaconState; outcome: BeaconOutcome } {
  if (state.solved) return { state, outcome: 'ignored' };
  if (state.sequence[state.progress] !== symbol) {
    return { state: { ...state, progress: 0, attempts: state.attempts + 1 }, outcome: 'rejected' };
  }
  const progress = state.progress + 1;
  const solved = progress === state.sequence.length;
  return { state: { ...state, progress, solved }, outcome: solved ? 'solved' : 'synced' };
}

/** 0: no hint · 1: first symbol · 2: the whole order (never before two misses). */
export function hintLevel(state: BeaconState): 0 | 1 | 2 {
  const failures = state.attempts - 1;
  return failures >= 2 ? 2 : failures === 1 ? 1 : 0;
}

/** What the HUD slots show: synced symbols, then hinted ones, then unknown. */
export function hudSlots(
  state: BeaconState,
): Array<{ symbol: BeaconSymbol | null; synced: boolean }> {
  const hint = hintLevel(state);
  return state.sequence.map((symbol, i) => {
    const synced = i < state.progress;
    const shown = synced || hint === 2 || (hint === 1 && i === 0);
    return { symbol: shown ? symbol : null, synced };
  });
}
