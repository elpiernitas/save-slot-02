import { describe, expect, it } from 'vitest';
import {
  activateBeacon,
  hintLevel,
  hudSlots,
  initialBeacons,
  ROUTE_ROUNDS,
  ROUTE_SEQUENCE,
  ROUTE_SEQUENCE_2,
} from './routeBeacons';

/** The original single-round calibration (the ladder and hints per round). */
const one = () => initialBeacons([ROUTE_SEQUENCE]);

describe('ROUTE BEACONS (pure)', () => {
  it('starts at zero progress, one attempt, unsolved', () => {
    expect(initialBeacons()).toEqual({
      sequence: ROUTE_SEQUENCE,
      round: 0,
      rounds: ROUTE_ROUNDS,
      progress: 0,
      attempts: 1,
      solved: false,
    });
  });

  it('syncs beacons in order and solves on the third', () => {
    let s = one();
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
    let s = activateBeacon(one(), 'cup').state;
    const r = activateBeacon(s, 'bird');
    expect(r.outcome).toBe('rejected');
    expect(r.state).toMatchObject({ progress: 0, attempts: 2, solved: false });
    s = r.state;
    for (const symbol of ROUTE_SEQUENCE) s = activateBeacon(s, symbol).state;
    expect(s).toMatchObject({ solved: true, attempts: 2 });
  });

  it('hint ladder: none, first symbol after one miss, full order after two', () => {
    let s = one();
    expect([hintLevel(s), hudSlots(s).map((x) => x.symbol)]).toEqual([0, [null, null, null]]);
    s = activateBeacon(s, 'bird').state;
    expect([hintLevel(s), hudSlots(s).map((x) => x.symbol)]).toEqual([1, ['cup', null, null]]);
    s = activateBeacon(s, 'lamp').state;
    expect([hintLevel(s), hudSlots(s).map((x) => x.symbol)]).toEqual([2, ROUTE_SEQUENCE]);
  });

  it('HUD marks synced slots; hints never change the solution', () => {
    const s = activateBeacon(one(), 'cup').state;
    expect(hudSlots(s)).toEqual([
      { symbol: 'cup', synced: true },
      { symbol: null, synced: false },
      { symbol: null, synced: false },
    ]);
    expect(s.sequence).toBe(ROUTE_SEQUENCE);
  });

  it('two rounds: the first order, then a longer one over the same objects', () => {
    let s = initialBeacons();
    const outcomes: string[] = [];
    for (const symbol of [...ROUTE_SEQUENCE, ...ROUTE_SEQUENCE_2]) {
      const r = activateBeacon(s, symbol);
      s = r.state;
      outcomes.push(r.outcome);
    }
    expect(outcomes).toEqual([
      'synced',
      'synced',
      'round',
      'synced',
      'synced',
      'synced',
      'synced',
      'solved',
    ]);
    expect(s).toMatchObject({ round: 1, solved: true, progress: 5 });
  });

  it('a mistake in round 2 only restarts round 2', () => {
    let s = initialBeacons();
    for (const symbol of ROUTE_SEQUENCE) s = activateBeacon(s, symbol).state;
    s = activateBeacon(s, 'bird').state;
    s = activateBeacon(s, 'lamp').state; // wrong: expected cup
    expect(s).toMatchObject({ round: 1, progress: 0, attempts: 2, solved: false });
  });
});
