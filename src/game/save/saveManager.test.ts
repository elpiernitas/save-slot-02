import { describe, expect, it } from 'vitest';
import { createFixedClock } from '../../lib/time';
import { createInitialSave } from '../state/newGame';
import { SAVE_VERSION } from '../state/types';
import { CORRUPT_BACKUP_KEY, createSaveManager, SAVE_STORAGE_KEY } from './saveManager';
import { createMemoryStorageDriver, type StorageDriver } from './storageDriver';

const clock = createFixedClock('2026-09-28T09:00:00Z');

function setup(initial: Record<string, string> = {}) {
  const driver = createMemoryStorageDriver(initial);
  return { driver, manager: createSaveManager({ driver, clock }) };
}

describe('createNewGame', () => {
  it('creates a versioned, JSON-safe save at the initial scene', () => {
    const { manager } = setup();
    const save = manager.createNewGame();
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.progress.sceneId).toBe('systemCheck');
    expect(save.timestamps.createdAt).toBe('2026-09-28T09:00:00.000Z');
    expect(JSON.parse(JSON.stringify(save))).toEqual(save);
  });
});

describe('save / load round trip', () => {
  it('returns empty when nothing is stored', async () => {
    const { manager } = setup();
    expect(await manager.loadGame()).toEqual({ status: 'empty' });
  });

  it('persists and restores a save', async () => {
    const { manager, driver } = setup();
    const save = { ...manager.createNewGame(), flags: { metTheCat: true } };
    await manager.saveGame(save);
    expect(await driver.getItem(SAVE_STORAGE_KEY)).not.toBeNull();
    expect(await manager.loadGame()).toEqual({ status: 'loaded', save, migratedFrom: null });
  });

  it('fills sections missing from an older partial save', async () => {
    const partial = { version: SAVE_VERSION, flags: { a: 1 } };
    const { manager } = setup({ [SAVE_STORAGE_KEY]: JSON.stringify(partial) });
    const result = await manager.loadGame();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.save.flags).toEqual({ a: 1 });
    expect(result.save.inventory).toEqual({ items: {} });
    expect(result.save.progress.sceneId).toBe('systemCheck');
  });

  it('falls back to the initial scene if the stored scene no longer exists', async () => {
    const stored = createInitialSave(clock.now());
    const raw = { ...stored, progress: { ...stored.progress, sceneId: 'deletedScene' } };
    const { manager } = setup({ [SAVE_STORAGE_KEY]: JSON.stringify(raw) });
    const result = await manager.loadGame();
    expect(result.status === 'loaded' && result.save.progress.sceneId).toBe('systemCheck');
  });
});

describe('corrupt / incompatible data', () => {
  it.each([
    ['invalid JSON', '{nope'],
    ['not an object', '"hello"'],
    ['no version', '{"flags":{}}'],
    ['future version', JSON.stringify({ version: SAVE_VERSION + 1 })],
  ])('reports %s as corrupt', async (_label, raw) => {
    const { manager } = setup({ [SAVE_STORAGE_KEY]: raw });
    expect((await manager.loadGame()).status).toBe('corrupt');
  });

  it('loadOrCreateGame backs up corrupt data and starts fresh', async () => {
    const { manager, driver } = setup({ [SAVE_STORAGE_KEY]: '{nope' });
    const boot = await manager.loadOrCreateGame();
    expect(boot.source).toBe('recovered');
    expect(await driver.getItem(CORRUPT_BACKUP_KEY)).toBe('{nope');
    expect((await manager.loadGame()).status).toBe('loaded');
  });
});

describe('loadOrCreateGame', () => {
  it('creates and persists a new game on first boot', async () => {
    const { manager } = setup();
    const boot = await manager.loadOrCreateGame();
    expect(boot.source).toBe('new');
    expect(await manager.loadGame()).toMatchObject({ status: 'loaded', save: boot.save });
  });

  it('loads an existing game', async () => {
    const { manager } = setup();
    const save = { ...manager.createNewGame(), choices: { firstWords: 'hello' } };
    await manager.saveGame(save);
    const boot = await manager.loadOrCreateGame();
    expect(boot).toEqual({ save, source: 'loaded' });
  });

  it('migrates an old save and writes the upgraded version back', async () => {
    const v1 = { ...createInitialSave(clock.now()), version: 1 };
    const driver = createMemoryStorageDriver({ [SAVE_STORAGE_KEY]: JSON.stringify(v1) });
    const manager = createSaveManager({
      driver,
      clock,
      targetVersion: 2,
      migrations: {
        1: (raw) => ({ ...raw, version: 2, flags: { ...(raw.flags as object), migrated: true } }),
      },
    });

    const boot = await manager.loadOrCreateGame();
    expect(boot.source).toBe('loaded');
    expect(boot.save.flags).toEqual({ migrated: true });
    const stored = JSON.parse((await driver.getItem(SAVE_STORAGE_KEY)) ?? 'null') as {
      version: number;
    };
    expect(stored.version).toBe(2);
  });
});

describe('resetGame', () => {
  it('wipes progress but keeps settings by default', async () => {
    const { manager } = setup();
    const save = manager.createNewGame();
    save.flags.progressed = true;
    save.settings.audio = { ...save.settings.audio, muted: true };
    await manager.saveGame(save);

    const fresh = await manager.resetGame();
    expect(fresh.flags).toEqual({});
    expect(fresh.settings.audio.muted).toBe(true);
  });

  it('can reset settings too', async () => {
    const { manager } = setup();
    const save = manager.createNewGame();
    save.settings.audio = { ...save.settings.audio, muted: true };
    await manager.saveGame(save);
    expect((await manager.resetGame({ keepSettings: false })).settings.audio.muted).toBe(false);
  });
});

describe('storage failures', () => {
  it('propagates write errors (e.g. quota) to the caller', async () => {
    const failing: StorageDriver = {
      ...createMemoryStorageDriver(),
      setItem: () => Promise.reject(new Error('QuotaExceededError')),
    };
    const manager = createSaveManager({ driver: failing, clock });
    await expect(manager.saveGame(manager.createNewGame())).rejects.toThrow('QuotaExceededError');
  });
});
