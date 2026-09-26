import { describe, expect, it } from 'vitest';
import { MURALLA_FLAGS } from '../content/dialogue/muralla';
import { ROUTE_FLAGS } from '../content/dialogue/route';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import {
  BEACONS_ID,
  chapterInteraction,
  chapterStep,
  routeUpdateDue,
  TERMINAL_ID,
} from './chapter';

const at = '2026-09-28T17:00:00.000Z';
const base = createInitialSave(new Date(at));
const flag = (s: typeof base, f: string) =>
  gameReducer(s, { type: 'flag/set', flag: f, value: true, at });
const done = (s: typeof base, puzzle: string) =>
  gameReducer(s, { type: 'puzzle/complete', puzzle, attempts: 1, at });

describe('GAME-06 chapter flow in La Muralla', () => {
  it('intro → route update due after the waitress → calibrating → service → done', () => {
    expect([chapterStep(base), routeUpdateDue(base)]).toEqual(['intro', false]);
    const met = flag(base, MURALLA_FLAGS.metWaitress);
    expect(routeUpdateDue(met)).toBe(true);
    const updated = flag(met, ROUTE_FLAGS.updated);
    expect([chapterStep(updated), routeUpdateDue(updated)]).toEqual(['calibrating', false]);
    const beacons = done(updated, BEACONS_ID);
    expect(chapterStep(beacons)).toBe('serviceAccess');
    expect(chapterStep(done(beacons, TERMINAL_ID))).toBe('done');
  });

  it('beacons answer only while calibrating; other times objects keep their lines', () => {
    const updated = flag(base, ROUTE_FLAGS.updated);
    expect(chapterInteraction('lamp', base)).toEqual({ kind: 'default' });
    expect(chapterInteraction('lamp', updated)).toEqual({ kind: 'beacon', symbol: 'lamp' });
    expect(chapterInteraction('board', updated)).toEqual({ kind: 'beacon', symbol: 'cup' });
    expect(chapterInteraction('gull', updated)).toEqual({ kind: 'beacon', symbol: 'bird' });
    expect(chapterInteraction('waitress', updated)).toEqual({ kind: 'default' });
    expect(chapterInteraction('lamp', done(updated, BEACONS_ID))).toEqual({ kind: 'default' });
  });

  it('the door is the route node, then SERVICE ACCESS, then inert', () => {
    const updated = flag(base, ROUTE_FLAGS.updated);
    const beacons = done(updated, BEACONS_ID);
    expect(chapterInteraction('barDoor', base).kind).toBe('default');
    expect(chapterInteraction('barDoor', updated).kind).toBe('routeNode');
    expect(chapterInteraction('barDoor', beacons).kind).toBe('serviceAccess');
    expect(chapterInteraction('barDoor', done(beacons, TERMINAL_ID)).kind).toBe('serviceDone');
  });

  it('prototype keys are not beacons', () => {
    expect(chapterInteraction('toString', flag(base, ROUTE_FLAGS.updated))).toEqual({
      kind: 'default',
    });
  });
});
