import { describe, expect, it } from 'vitest';
import { MIGRATIONS, migrateSave, SaveMigrationError, type MigrationTable } from './migrations';
import { SAVE_VERSION } from '../state/types';

describe('migrateSave', () => {
  const table: MigrationTable = {
    1: (raw) => ({ ...raw, version: 2, renamed: raw.old }),
    2: (raw) => ({ ...raw, version: 3, added: true }),
  };

  it('is a no-op for a current save', () => {
    expect(migrateSave({ version: 3, a: 1 }, 3, table)).toEqual({
      save: { version: 3, a: 1 },
      migratedFrom: null,
    });
  });

  it('chains migrations step by step', () => {
    expect(migrateSave({ version: 1, old: 'x' }, 3, table)).toEqual({
      save: { version: 3, old: 'x', renamed: 'x', added: true },
      migratedFrom: 1,
    });
  });

  it('refuses saves from a newer build', () => {
    expect(() => migrateSave({ version: 4 }, 3, table)).toThrow(SaveMigrationError);
  });

  it('fails loudly when a migration is missing or misbehaves', () => {
    expect(() => migrateSave({ version: 1 }, 3, { 1: table[1]! })).toThrow(/Missing migration/);
    expect(() => migrateSave({ version: 1 }, 2, { 1: (raw) => ({ ...raw, version: 5 }) })).toThrow(
      /produced version 5/,
    );
  });

  it('rejects invalid versions', () => {
    expect(() => migrateSave({ version: 0 })).toThrow(SaveMigrationError);
    expect(() => migrateSave({ version: 1.5 })).toThrow(SaveMigrationError);
  });

  it('has a migration for every version below the current one', () => {
    for (let v = 1; v < SAVE_VERSION; v++) expect(MIGRATIONS[v]).toBeTypeOf('function');
  });
});

describe('v1 → v2 (GAME-01)', () => {
  /** A real save exactly as written by the GAME-00 build. */
  const V1_FIXTURE = {
    version: 1,
    player: { name: null, classId: null },
    progress: { sceneId: 'boot', checkpoint: null, completedScenes: [] },
    flags: { keepMe: true },
    choices: {},
    inventory: { items: {} },
    cards: { owned: {} },
    achievements: {},
    puzzles: {},
    boss: { defeated: false, attempts: 0, defeatedAt: null },
    quests: {},
    dateQuest: { chosenOptionId: null, chosenAt: null },
    unlocks: {},
    timestamps: {
      createdAt: '2026-09-25T18:00:00.000Z',
      updatedAt: '2026-09-25T18:00:00.000Z',
      lastPlayedAt: '2026-09-25T18:00:00.000Z',
      completedAt: null,
    },
    settings: {
      audio: { muted: true, volume: { music: 0.6, sfx: 0.8, voice: 0.5 } },
      textSpeed: 'normal',
      reducedMotion: 'system',
    },
  };

  it('adds system flags and resume scene without touching existing progress', () => {
    const { save, migratedFrom } = migrateSave(structuredClone(V1_FIXTURE), 2);
    expect(migratedFrom).toBe(1);
    expect(save).toEqual({
      ...V1_FIXTURE,
      version: 2,
      progress: { ...V1_FIXTURE.progress, resumeSceneId: null },
      system: { bootCompletedAt: null, enteredGameAt: null, sessionCount: 0, lastSessionAt: null },
    });
  });

  it('survives a v1 save with a missing progress section', () => {
    const { save } = migrateSave({ version: 1 }, 2);
    expect(save.progress).toEqual({ resumeSceneId: null });
  });
});
