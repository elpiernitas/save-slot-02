import { describe, expect, it } from 'vitest';
import {
  canLeave,
  initialTerminal,
  isChannelSynced,
  openings,
  terminalReducer,
  type TerminalState,
} from './syncTerminal';

const rotate = (s: TerminalState, tile: number, times = 1) => {
  for (let i = 0; i < times; i++) s = terminalReducer(s, { type: 'rotate', tile });
  return s;
};

/** A: straight west–east · B: corner west–south (rot 2) · C: corner north–east (rot 0) · D: corner west–south (rot 2). */
const solve = (s: TerminalState) => rotate(rotate(rotate(rotate(s, 0, 1), 1, 2), 2, 2), 3, 1);

describe('SYNC TERMINAL (pure)', () => {
  it('starts unsolved, on tile A, leavable', () => {
    const s = initialTerminal();
    expect(isChannelSynced(s.tiles)).toBe(false);
    expect([s.cursor, s.phase, canLeave(s)]).toEqual([0, 'solving', true]);
  });

  it('rotates openings clockwise', () => {
    expect(openings({ kind: 'straight', rot: 1, col: 0, row: 0 })).toEqual(['n', 's']);
    expect(openings({ kind: 'corner', rot: 2, col: 0, row: 0 })).toEqual(['s', 'w']);
  });

  it('moves the cursor between neighbouring tiles only', () => {
    let s = initialTerminal();
    s = terminalReducer(s, { type: 'move', dir: 'w' });
    expect(s.cursor).toBe(0);
    s = terminalReducer(s, { type: 'move', dir: 'e' });
    s = terminalReducer(s, { type: 'move', dir: 's' });
    expect(s.cursor).toBe(2);
    s = terminalReducer(s, { type: 'move', dir: 'e' });
    expect(s.cursor).toBe(3);
    s = terminalReducer(s, { type: 'move', dir: 'n' });
    expect(s.cursor).toBe(3); // (2,0) is empty
  });

  it('a partial path does not complete early', () => {
    const s = rotate(rotate(rotate(initialTerminal(), 0, 1), 1, 2), 2, 2);
    expect(s.phase).toBe('solving');
    expect(isChannelSynced(s.tiles)).toBe(false);
  });

  it('syncs PLAYER 1 when source reaches output, then locks input', () => {
    const s = solve(initialTerminal());
    expect(s.phase).toBe('p1Synced');
    expect(canLeave(s)).toBe(false);
    expect(terminalReducer(s, { type: 'rotate', tile: 0 })).toBe(s);
  });

  it('walks the fixed sequence to the fallback and ends done', () => {
    let s = solve(initialTerminal());
    const phases = [s.phase];
    for (let i = 0; i < 6; i++) {
      s = terminalReducer(s, { type: 'advance' });
      phases.push(s.phase);
    }
    expect(phases).toEqual([
      'p1Synced',
      'p2Check',
      'fallback',
      'recovering',
      'done',
      'done',
      'done',
    ]);
  });

  it('advance does nothing before PLAYER 1 is synced (fallback needs a solve)', () => {
    const s = initialTerminal();
    expect(terminalReducer(s, { type: 'advance' })).toBe(s);
  });
});
