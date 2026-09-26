import { describe, expect, it } from 'vitest';
import { evaluateCondition } from '../state/conditions';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import { SAVE_VERSION } from '../state/types';
import { PUZZLES, puzzleDefinition } from './registry';

const now = new Date('2026-09-28T09:00:00Z');
const T1 = '2026-09-28T09:05:00.000Z';
const T2 = '2026-09-28T09:10:00.000Z';
const ID = 'route.muralla_beacons';

describe('puzzle completion (GAME-06 core)', () => {
  const initial = createInitialSave(now);

  it('stores the first completion with its attempts', () => {
    const done = gameReducer(initial, { type: 'puzzle/complete', puzzle: ID, attempts: 3, at: T1 });
    expect(done.puzzles[ID]).toEqual({ completedAt: T1, attempts: 3 });
    expect(done.timestamps.updatedAt).toBe(T1);
  });

  it('first completion wins: a later one is a no-op (timestamps untouched)', () => {
    const done = gameReducer(initial, { type: 'puzzle/complete', puzzle: ID, attempts: 3, at: T1 });
    expect(gameReducer(done, { type: 'puzzle/complete', puzzle: ID, attempts: 1, at: T2 })).toBe(
      done,
    );
  });

  it('clamps attempts to at least 1 and ignores unknown puzzles', () => {
    const done = gameReducer(initial, { type: 'puzzle/complete', puzzle: ID, attempts: 0, at: T1 });
    expect(done.puzzles[ID]?.attempts).toBe(1);
    expect(
      gameReducer(initial, { type: 'puzzle/complete', puzzle: 'nope', attempts: 1, at: T1 }),
    ).toBe(initial);
  });

  it('puzzleCompleted condition follows the save; no save-version bump', () => {
    const cond = { kind: 'puzzleCompleted', puzzle: ID } as const;
    expect(evaluateCondition(cond, { save: initial, now })).toBe(false);
    const done = gameReducer(initial, { type: 'puzzle/complete', puzzle: ID, attempts: 1, at: T1 });
    expect(evaluateCondition(cond, { save: done, now })).toBe(true);
    expect(SAVE_VERSION).toBe(2);
  });

  it('registry ids are semantic and match their keys', () => {
    for (const [key, def] of Object.entries(PUZZLES)) {
      expect(def.id).toBe(key);
      expect(key).toMatch(/^(route|system|micro)\.[a-z_]+$/);
    }
    expect(puzzleDefinition('toString')).toBeUndefined();
  });
});
