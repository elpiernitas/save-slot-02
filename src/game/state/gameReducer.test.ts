import { describe, expect, it } from 'vitest';
import { gameReducer } from './gameReducer';
import { createInitialSave } from './newGame';

const T0 = new Date('2026-09-28T09:00:00Z');
const T1 = '2026-09-28T09:05:00.000Z';
const T2 = '2026-09-28T09:10:00.000Z';

describe('gameReducer', () => {
  const initial = createInitialSave(T0);

  it('moves between scenes and touches timestamps', () => {
    const next = gameReducer(initial, { type: 'scene/goTo', scene: 'title', at: T1 });
    expect(next.progress.sceneId).toBe('title');
    expect(next.progress.checkpoint).toBeNull();
    expect(next.timestamps.updatedAt).toBe(T1);
    expect(next.timestamps.createdAt).toBe(initial.timestamps.createdAt);
    expect(initial.progress.sceneId).toBe('systemCheck'); // immutability
  });

  it('records completed scenes once', () => {
    const once = gameReducer(initial, { type: 'scene/complete', scene: 'title', at: T1 });
    const twice = gameReducer(once, { type: 'scene/complete', scene: 'title', at: T2 });
    expect(twice.progress.completedScenes).toEqual(['title']);
    expect(twice).toBe(once);
  });

  it('sets flags and records choices', () => {
    let save = gameReducer(initial, { type: 'flag/set', flag: 'sawIntro', value: true, at: T1 });
    save = gameReducer(save, { type: 'choice/record', choice: 'firstAnswer', option: 'b', at: T1 });
    expect(save.flags).toEqual({ sawIntro: true });
    expect(save.choices).toEqual({ firstAnswer: 'b' });
  });

  it('returns the same object when a flag does not change (no pointless autosave)', () => {
    const save = gameReducer(initial, { type: 'flag/set', flag: 'x', value: 1, at: T1 });
    expect(gameReducer(save, { type: 'flag/set', flag: 'x', value: 1, at: T2 })).toBe(save);
  });

  it('keeps the first unlock time of an achievement', () => {
    let save = gameReducer(initial, { type: 'achievement/unlock', achievement: 'hello', at: T1 });
    save = gameReducer(save, { type: 'achievement/unlock', achievement: 'hello', at: T2 });
    expect(save.achievements).toEqual({ hello: { unlockedAt: T1 } });
  });

  it('updates settings partially', () => {
    const save = gameReducer(initial, {
      type: 'settings/update',
      settings: { textSpeed: 'fast' },
      at: T1,
    });
    expect(save.settings.textSpeed).toBe('fast');
    expect(save.settings.audio).toEqual(initial.settings.audio);
  });

  it('replaces the whole save', () => {
    const other = createInitialSave(new Date('2026-10-01T00:00:00Z'));
    expect(gameReducer(initial, { type: 'save/replace', save: other })).toBe(other);
  });
});

describe('gameReducer — start-up / system (v2)', () => {
  const initial = createInitialSave(T0);

  it('sessionStart counts sessions and always restarts at the system check', () => {
    const inTitle = gameReducer(initial, { type: 'scene/goTo', scene: 'title', at: T1 });
    const next = gameReducer(inTitle, { type: 'system/sessionStart', at: T2 });
    expect(next.progress.sceneId).toBe('systemCheck');
    expect(next.system.sessionCount).toBe(1);
    expect(next.system.lastSessionAt).toBe(T2);
  });

  it('remembers only gameplay scenes as the resume point', () => {
    let save = gameReducer(initial, { type: 'scene/goTo', scene: 'classSelect', at: T1 });
    save = gameReducer(save, { type: 'scene/goTo', scene: 'title', at: T2 });
    expect(save.progress.sceneId).toBe('title');
    expect(save.progress.resumeSceneId).toBe('classSelect');
  });

  it('keeps the first boot/enter timestamps', () => {
    let save = gameReducer(initial, { type: 'system/bootCompleted', at: T1 });
    save = gameReducer(save, { type: 'system/bootCompleted', at: T2 });
    save = gameReducer(save, { type: 'system/enteredGame', at: T1 });
    save = gameReducer(save, { type: 'system/enteredGame', at: T2 });
    expect(save.system.bootCompletedAt).toBe(T1);
    expect(save.system.enteredGameAt).toBe(T1);
  });
});
