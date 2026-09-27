import { describe, expect, it } from 'vitest';
import { ROUTE_FLAGS } from '../content/dialogue/route';
import { STORY_FLAGS } from '../boss/story';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import { BEACONS_ID, SEAGULL_ID, TERMINAL_ID } from '../puzzles/chapter';
import { chapterFor, chapterLevel, chapterSeenFlag } from './chapters';

const at = '2026-09-28T17:00:00.000Z';
const base = createInitialSave(new Date(at));
const flag = (save: typeof base, name: string) =>
  gameReducer(save, { type: 'flag/set', flag: name, value: true, at });
const puzzle = (save: typeof base, id: string) =>
  gameReducer(save, { type: 'puzzle/complete', puzzle: id, attempts: 1, at });

describe('visible chapter progression', () => {
  it('derives levels from narrative evidence without adding save fields', () => {
    let save = base;
    expect(chapterLevel(save)).toBe(1);
    save = flag(save, ROUTE_FLAGS.updated);
    expect(chapterLevel(save)).toBe(2);
    save = puzzle(save, BEACONS_ID);
    expect(chapterLevel(save)).toBe(3);
    save = puzzle(save, SEAGULL_ID);
    expect(chapterLevel(save)).toBe(4);
    save = puzzle(save, TERMINAL_ID);
    expect(chapterLevel(save)).toBe(5);
    save = gameReducer(save, { type: 'boss/defeat', at });
    expect(chapterLevel(save)).toBe(6);
    save = flag(save, STORY_FLAGS.player2GateComplete);
    expect(chapterLevel(save)).toBe(7);
    expect(chapterFor(save).title).toBe('RUTA ELEGIDA');
  });

  it('uses stable two-digit seen flags', () => {
    expect(chapterSeenFlag(1)).toBe('chapter.seen.01');
    expect(chapterSeenFlag(7)).toBe('chapter.seen.07');
  });
});
