import { describe, expect, it } from 'vitest';
import {
  activateBeacon,
  hintLevel,
  hudSlots,
  initialBeacons,
  ROUTE_SEQUENCE,
} from './routeBeacons';

describe('ROUTE BEACONS (pure)', () => {
  it('starts at zero progress, one attempt, unsolved', () => {
    expect(initialBeacons()).toEqual({
      sequence: ROUTE_SEQUENCE,
      progress: 0,
      attempts: 1,
      solved: false,
    });
  });

  it('syncs beacons in order and solves on the third', () => {
    let s = initialBeacons();
    const outcomes = ROUTE_SEQUENCE.map((symbol) => {
      const r = activateBeacon(s, symbol);
      s = r.state;
      return r.outcome;
    });
    expect(outcomes).toEqual(['synced', 'synced', 'solved']);
    expect(s).toMatchObject({ progress: 3, attempts: 1, solved: true });
    expect(activateBeacon(s, 'cup')).toEqual({ state: s, outcome: 'ignored' });
  });

  it('a wrong beacon resets progress and counts an attempt, without penalty', () => {
    let s = activateBeacon(initialBeacons(), 'cup').state;
    const r = activateBeacon(s, 'bird');
    expect(r.outcome).toBe('rejected');
    expect(r.state).toMatchObject({ progress: 0, attempts: 2, solved: false });
    s = r.state;
    for (const symbol of ROUTE_SEQUENCE) s = activateBeacon(s, symbol).state;
    expect(s).toMatchObject({ solved: true, attempts: 2 });
  });

  it('hint ladder: none, first symbol after one miss, full order after two', () => {
    let s = initialBeacons();
    expect([hintLevel(s), hudSlots(s).map((x) => x.symbol)]).toEqual([0, [null, null, null]]);
    s = activateBeacon(s, 'bird').state;
    expect([hintLevel(s), hudSlots(s).map((x) => x.symbol)]).toEqual([1, ['cup', null, null]]);
    s = activateBeacon(s, 'lamp').state;
    expect([hintLevel(s), hudSlots(s).map((x) => x.symbol)]).toEqual([2, ROUTE_SEQUENCE]);
  });

  it('HUD marks synced slots; hints never change the solution', () => {
    const s = activateBeacon(initialBeacons(), 'cup').state;
    expect(hudSlots(s)).toEqual([
      { symbol: 'cup', synced: true },
      { symbol: null, synced: false },
      { symbol: null, synced: false },
    ]);
    expect(s.sequence).toBe(ROUTE_SEQUENCE);
  });
});
