import { ROUTE_FLAGS } from '../content/dialogue/route';
import { MURALLA_FLAGS } from '../content/dialogue/muralla';
import type { GameSave } from '../state/types';
import type { BeaconSymbol } from './routeBeacons/routeBeacons';

/** GAME-06 puzzle ids (see registry). */
export const BEACONS_ID = 'route.muralla_beacons';
export const TERMINAL_ID = 'system.player_sync';
/** PZ-03 (content expansion): between the beacons and the terminal. */
export const SEAGULL_ID = 'route.seagull_protocol';
/** Duration pass (D-085): the route recalibration between the terminal and the boss. */
export const RECAL_ID = 'route.recalibration';

/**
 * The recalibration is done — or not owed: a save that already reached the
 * boss (it has fought or beaten it) keeps going straight to it.
 */
export const recalibrationDone = (save: GameSave) =>
  Object.hasOwn(save.puzzles, RECAL_ID) || save.boss.attempts > 0 || save.boss.defeated;

/** World interactables that act as beacons while calibrating. */
export const BEACON_OF: Readonly<Record<string, BeaconSymbol>> = {
  board: 'cup',
  lamp: 'lamp',
  gull: 'bird',
};

export type ChapterStep =
  | 'intro'
  /** Beacons active (route updated, not yet synced). */
  | 'calibrating'
  /** Beacons synced; the seagull interferes until its protocol is cleared. */
  | 'seagull'
  /** Seagull cleared; SERVICE ACCESS opens the terminal. */
  | 'serviceAccess'
  /** Terminal done; the route must be recalibrated before the boss. */
  | 'recalibrating'
  /** Terminal fallback applied: end of GAME-06. */
  | 'done';

export function chapterStep(save: GameSave): ChapterStep {
  if (Object.hasOwn(save.puzzles, TERMINAL_ID))
    return recalibrationDone(save) ? 'done' : 'recalibrating';
  if (Object.hasOwn(save.puzzles, BEACONS_ID)) {
    return Object.hasOwn(save.puzzles, SEAGULL_ID) ? 'serviceAccess' : 'seagull';
  }
  if (save.flags[ROUTE_FLAGS.updated]) return 'calibrating';
  return 'intro';
}

/** The route update fires after the first talk with the waitress (card 001). */
export const routeUpdateDue = (save: GameSave) =>
  chapterStep(save) === 'intro' && Boolean(save.flags[MURALLA_FLAGS.metWaitress]);

export type ChapterInteraction =
  | { kind: 'beacon'; symbol: BeaconSymbol }
  | { kind: 'routeNode' }
  | { kind: 'seagull' }
  | { kind: 'seagullHint' }
  | { kind: 'serviceBlocked' }
  | { kind: 'serviceAccess' }
  | { kind: 'serviceDone' }
  | { kind: 'default' };

/** What interacting with a world object means at this point of the chapter. */
export function chapterInteraction(id: string, save: GameSave): ChapterInteraction {
  const step = chapterStep(save);
  const symbol = Object.hasOwn(BEACON_OF, id) ? BEACON_OF[id] : undefined;
  if ((step === 'calibrating' || step === 'recalibrating') && symbol)
    return { kind: 'beacon', symbol };
  if (step === 'seagull' && id === 'gull') return { kind: 'seagull' };
  if (step === 'seagull' && id === 'board') return { kind: 'seagullHint' };
  if (id !== 'barDoor') return { kind: 'default' };
  if (step === 'seagull') return { kind: 'serviceBlocked' };
  if (step === 'calibrating' || step === 'recalibrating') return { kind: 'routeNode' };
  if (step === 'serviceAccess') return { kind: 'serviceAccess' };
  if (step === 'done') return { kind: 'serviceDone' };
  return { kind: 'default' };
}
