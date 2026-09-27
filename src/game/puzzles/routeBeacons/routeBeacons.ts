/**
 * PZ-01 ROUTE BEACONS — pure state (GAME_06_SPEC §9, PUZZLE_BIBLE).
 *
 * Three ordinary objects act as route beacons, each marked with a symbol.
 * The order is shown once as a pulse (replayable at the route node); the
 * player walks to each beacon and syncs it. A wrong beacon resets progress
 * and counts an attempt (runtime only). Hints never shame and only appear
 * after failures.
 *
 * Pacing pass (production audit): the route is calibrated in two rounds —
 * the original three beacons, then a longer order over the same three
 * objects that sends PLAYER 1 back and forth across the square.
 */
export type BeaconSymbol = 'cup' | 'lamp' | 'bird';

export interface BeaconState {
  /** The order being calibrated now (the current round). */
  sequence: readonly BeaconSymbol[];
  /** 0-based round and every round's order. */
  round: number;
  rounds: readonly (readonly BeaconSymbol[])[];
  /** How many beacons of the sequence are synced (0–3). */
  progress: number;
  /** Runtime attempts: 1 + wrong beacons so far. Stored only on completion. */
  attempts: number;
  solved: boolean;
}

export const SYMBOL_LABEL: Readonly<Record<BeaconSymbol, string>> = {
  cup: 'TAZA',
  lamp: 'FAROLA',
  bird: 'GAVIOTA',
};

export const ROUTE_SEQUENCE: readonly BeaconSymbol[] = ['cup', 'lamp', 'bird'];
/** Second round: same objects, longer order, crossing the square. */
export const ROUTE_SEQUENCE_2: readonly BeaconSymbol[] = ['bird', 'cup', 'lamp', 'cup', 'bird'];
export const ROUTE_ROUNDS: readonly (readonly BeaconSymbol[])[] = [
  ROUTE_SEQUENCE,
  ROUTE_SEQUENCE_2,
];

export function initialBeacons(
  rounds: readonly (readonly BeaconSymbol[])[] = ROUTE_ROUNDS,
): BeaconState {
  return { sequence: rounds[0]!, round: 0, rounds, progress: 0, attempts: 1, solved: false };
}

/** `round` = a round other than the last was completed; the next order starts. */
export type BeaconOutcome = 'synced' | 'rejected' | 'round' | 'solved' | 'ignored';

export function activateBeacon(
  state: BeaconState,
  symbol: BeaconSymbol,
): { state: BeaconState; outcome: BeaconOutcome } {
  if (state.solved) return { state, outcome: 'ignored' };
  if (state.sequence[state.progress] !== symbol) {
    return { state: { ...state, progress: 0, attempts: state.attempts + 1 }, outcome: 'rejected' };
  }
  const progress = state.progress + 1;
  if (progress < state.sequence.length) return { state: { ...state, progress }, outcome: 'synced' };
  const next = state.rounds[state.round + 1];
  if (next) {
    return {
      state: { ...state, round: state.round + 1, sequence: next, progress: 0, attempts: 1 },
      outcome: 'round',
    };
  }
  return { state: { ...state, progress, solved: true }, outcome: 'solved' };
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
