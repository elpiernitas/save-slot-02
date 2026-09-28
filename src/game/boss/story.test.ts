import { describe, expect, it } from 'vitest';
import { RECAL_ID, TERMINAL_ID } from '../puzzles/chapter';
import { continueTarget } from '../scenes/flow';
import { evaluateCondition } from '../state/conditions';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import { SAVE_VERSION } from '../state/types';
import { STORY_FLAGS, storyScene } from './story';

const now = new Date('2026-09-28T18:00:00Z');
const T1 = '2026-09-28T18:05:00.000Z';
const T2 = '2026-09-28T18:10:00.000Z';
const base = createInitialSave(now);

describe('boss save actions (GAME-07)', () => {
  it('boss/attempt increments and touches timestamps', () => {
    const one = gameReducer(base, { type: 'boss/attempt', at: T1 });
    expect(one.boss).toEqual({ defeated: false, attempts: 1, defeatedAt: null });
    expect(one.timestamps.updatedAt).toBe(T1);
  });

  it('boss/defeat: first write wins, attempts at least 1, later attempts ignored', () => {
    const won = gameReducer(base, { type: 'boss/defeat', at: T1 });
    expect(won.boss).toEqual({ defeated: true, attempts: 1, defeatedAt: T1 });
    expect(gameReducer(won, { type: 'boss/defeat', at: T2 })).toBe(won);
    expect(gameReducer(won, { type: 'boss/attempt', at: T2 })).toBe(won);
    expect(evaluateCondition({ kind: 'bossDefeated' }, { save: won, now })).toBe(true);
    expect(SAVE_VERSION).toBe(2);
  });

  it('keeps the attempt count on defeat', () => {
    let s = gameReducer(base, { type: 'boss/attempt', at: T1 });
    s = gameReducer(s, { type: 'boss/attempt', at: T1 });
    s = gameReducer(s, { type: 'boss/defeat', at: T2 });
    expect(s.boss.attempts).toBe(2);
  });
});

describe('story routing (refresh never replays a finished stage)', () => {
  const terminal = gameReducer(base, {
    type: 'puzzle/complete',
    puzzle: TERMINAL_ID,
    attempts: 1,
    at: T1,
  });
  const recal = gameReducer(terminal, {
    type: 'puzzle/complete',
    puzzle: RECAL_ID,
    attempts: 1,
    at: T1,
  });
  const defeated = gameReducer(recal, { type: 'boss/defeat', at: T1 });
  const found = gameReducer(defeated, {
    type: 'flag/set',
    flag: STORY_FLAGS.player2Found,
    value: true,
    at: T1,
  });
  const gate = gameReducer(found, {
    type: 'flag/set',
    flag: STORY_FLAGS.player2GateComplete,
    value: true,
    at: T1,
  });

  it('maps each stage to its scene', () => {
    expect(storyScene(base)).toBeNull();
    // D-085: terminal done → recalibrate in La Muralla first (overworld).
    expect(storyScene(terminal)).toBeNull();
    expect(storyScene(recal)).toBe('boss');
    // A save that had already entered the fight keeps its boss.
    expect(storyScene(gameReducer(terminal, { type: 'boss/attempt', at: T1 }))).toBe('boss');
    expect(storyScene(defeated)).toBe('player2Reveal');
    expect(storyScene(found)).toBe('player2Reveal');
    expect(storyScene(gate)).toBe('dateGate');
  });

  it('CONTINUE follows the story even if the last scene says otherwise', () => {
    const stale = {
      ...defeated,
      progress: { ...defeated.progress, resumeSceneId: 'boss' as const },
    };
    expect(continueTarget(stale)).toBe('player2Reveal');
    expect(continueTarget(gate)).toBe('dateGate');
  });
});
