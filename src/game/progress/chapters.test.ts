import { describe, expect, it } from 'vitest';
import { STORY_FLAGS } from '../boss/story';
import { ROUTE_FLAGS } from '../content/dialogue/route';
import { BEACONS_ID, RECAL_ID, SEAGULL_ID, TERMINAL_ID } from '../puzzles/chapter';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import {
  chapterCardDue,
  chapterCardToShow,
  chapterLevel,
  chapterSeenFlag,
  LEVELS,
  levelLabel,
} from './chapters';

const at = '2026-09-28T17:00:00.000Z';
type S = ReturnType<typeof createInitialSave>;
const flag = (s: S, f: string) => gameReducer(s, { type: 'flag/set', flag: f, value: true, at });
const done = (s: S, puzzle: string) =>
  gameReducer(s, { type: 'puzzle/complete', puzzle, attempts: 1, at });

describe('visible chapters', () => {
  it('advance with each real goal, 01 → 07', () => {
    let s = createInitialSave(new Date(at));
    const seen: number[] = [chapterLevel(s).n];
    s = flag(s, ROUTE_FLAGS.updated);
    seen.push(chapterLevel(s).n);
    s = done(s, BEACONS_ID);
    seen.push(chapterLevel(s).n);
    s = done(s, SEAGULL_ID);
    seen.push(chapterLevel(s).n);
    s = done(s, TERMINAL_ID);
    // D-085: still NIVEL 04, with the recalibration as its objective.
    expect(chapterLevel(s)).toMatchObject({ n: 4, objective: expect.stringMatching(/Recalibra/) });
    s = done(s, RECAL_ID);
    seen.push(chapterLevel(s).n);
    s = gameReducer(s, { type: 'boss/defeat', at });
    seen.push(chapterLevel(s).n);
    s = flag(s, STORY_FLAGS.player2GateComplete);
    seen.push(chapterLevel(s).n);
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('has seven titled levels with an objective each', () => {
    expect(LEVELS.map((l) => l.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const l of LEVELS) expect(l.objective.length).toBeGreaterThan(5);
    expect(levelLabel(5)).toBe('NIVEL 05');
  });

  it('shows each title card once (generic flag)', () => {
    const s = createInitialSave(new Date(at));
    expect(chapterCardDue(s)).toBe(true);
    expect(chapterCardDue(flag(s, chapterSeenFlag(1)))).toBe(false);
  });

  // D-087 regression: a card closed by its own timer used to come back and
  // stay stuck, because the scene resumed on the next animation frame with a
  // save that did not hold the seen flag yet.
  it('never brings back the card that was just closed, before or after the flag lands', () => {
    const reach: ((s: S) => S)[] = [
      (s) => s,
      (s) => flag(s, ROUTE_FLAGS.updated),
      (s) => done(s, BEACONS_ID),
      (s) => done(s, SEAGULL_ID),
    ];
    let s = createInitialSave(new Date(at));
    for (const [i, step] of reach.entries()) {
      const n = i + 1;
      s = step(s);
      // The card of this level is due and shown…
      expect(chapterCardToShow(s)?.n).toBe(n);
      // …closed by its timer: a resume that still reads the stale save…
      expect(chapterCardToShow(s, n)).toBeNull();
      // …and the committed save both leave the world running.
      s = flag(s, chapterSeenFlag(n));
      expect(chapterCardToShow(s)).toBeNull();
      expect(chapterCardToShow(s, n)).toBeNull();
    }
  });

  it('still shows the next level after one was closed', () => {
    let s = flag(createInitialSave(new Date(at)), chapterSeenFlag(1));
    s = flag(s, ROUTE_FLAGS.updated);
    expect(chapterCardToShow(s, 1)?.n).toBe(2);
  });
});
