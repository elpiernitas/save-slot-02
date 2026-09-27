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

  it('keeps the first grant time of a post-game unlock', () => {
    let save = gameReducer(initial, { type: 'unlock/grant', unlock: 'postgame.randy', at: T1 });
    save = gameReducer(save, { type: 'unlock/grant', unlock: 'postgame.randy', at: T2 });
    expect(save.unlocks).toEqual({ 'postgame.randy': { unlockedAt: T1 } });
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

describe('settings/update — nested settings are never lost', () => {
  const initial = createInitialSave(T0);

  it('muting keeps every volume', () => {
    const save = gameReducer(initial, {
      type: 'settings/update',
      settings: { audio: { muted: true } },
      at: T1,
    });
    expect(save.settings.audio).toEqual({ ...initial.settings.audio, muted: true });
  });

  it('changing one channel volume keeps the others and mute state', () => {
    let save = gameReducer(initial, {
      type: 'settings/update',
      settings: { audio: { muted: true } },
      at: T1,
    });
    save = gameReducer(save, {
      type: 'settings/update',
      settings: { audio: { volume: { sfx: 0.2 } } },
      at: T2,
    });
    expect(save.settings.audio).toEqual({
      muted: true,
      volume: { ...initial.settings.audio.volume, sfx: 0.2 },
    });
  });

  it('textSpeed and reducedMotion update independently', () => {
    let save = gameReducer(initial, {
      type: 'settings/update',
      settings: { textSpeed: 'instant' },
      at: T1,
    });
    save = gameReducer(save, {
      type: 'settings/update',
      settings: { reducedMotion: 'on' },
      at: T2,
    });
    expect(save.settings).toEqual({
      ...initial.settings,
      textSpeed: 'instant',
      reducedMotion: 'on',
    });
  });

  it('does not mutate the previous settings object', () => {
    const before = structuredClone(initial.settings);
    gameReducer(initial, { type: 'settings/update', settings: { audio: { muted: true } }, at: T1 });
    expect(initial.settings).toEqual(before);
  });
});

describe('player/assignClass (GAME-03)', () => {
  const initial = createInitialSave(T0);

  it('stores the class and marks classSelect completed', () => {
    const save = gameReducer(initial, { type: 'player/assignClass', classId: 'healer', at: T1 });
    expect(save.player.classId).toBe('healer');
    expect(save.progress.completedScenes).toEqual(['classSelect']);
    expect(save.timestamps.updatedAt).toBe(T1);
  });

  it('never overwrites a confirmed class by accident', () => {
    const first = gameReducer(initial, { type: 'player/assignClass', classId: 'warrior', at: T1 });
    const again = gameReducer(first, { type: 'player/assignClass', classId: 'tank', at: T2 });
    expect(again).toBe(first);
    expect(again.player.classId).toBe('warrior');
  });
});

describe('checkpoints (GAME-04)', () => {
  const initial = createInitialSave(T0);
  const inWorld = () => {
    let save = gameReducer(initial, { type: 'scene/goTo', scene: 'overworld', at: T1 });
    save = gameReducer(save, {
      type: 'progress/checkpoint',
      checkpoint: 'muralla:terrace',
      at: T1,
    });
    return save;
  };

  it('stores the checkpoint and ignores repeats', () => {
    const save = inWorld();
    expect(save.progress.checkpoint).toBe('muralla:terrace');
    expect(
      gameReducer(save, { type: 'progress/checkpoint', checkpoint: 'muralla:terrace', at: T2 }),
    ).toBe(save);
  });

  it('survives going to the title and back, and a new session', () => {
    let save = gameReducer(inWorld(), { type: 'scene/goTo', scene: 'title', at: T2 });
    expect(save.progress.checkpoint).toBe('muralla:terrace');
    save = gameReducer(save, { type: 'system/sessionStart', at: T2 });
    expect(save.progress.checkpoint).toBe('muralla:terrace');
    save = gameReducer(save, { type: 'scene/goTo', scene: 'overworld', at: T2 });
    expect(save.progress.checkpoint).toBe('muralla:terrace');
  });

  it('is reset when entering a different gameplay scene', () => {
    const save = gameReducer(inWorld(), { type: 'scene/goTo', scene: 'dungeon', at: T2 });
    expect(save.progress.checkpoint).toBeNull();
  });
});
