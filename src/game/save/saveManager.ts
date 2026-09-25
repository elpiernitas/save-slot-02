import type { Clock } from '../../lib/time';
import { isSceneId, INITIAL_SCENE } from '../scenes/sceneIds';
import { createInitialSave } from '../state/newGame';
import { SAVE_VERSION, type GameSave } from '../state/types';
import { migrateSave, type MigrationTable, MIGRATIONS, type RawSave } from './migrations';
import type { StorageDriver } from './storageDriver';

export const SAVE_STORAGE_KEY = 'saveSlot02:save';
/** Where an unreadable save is parked so it is never silently destroyed. */
export const CORRUPT_BACKUP_KEY = 'saveSlot02:save:corrupt-backup';

export type LoadResult =
  | { status: 'empty' }
  | { status: 'loaded'; save: GameSave; migratedFrom: number | null }
  | { status: 'corrupt'; reason: string };

export type BootResult = {
  save: GameSave;
  source: 'new' | 'loaded' | 'recovered';
};

export interface SaveManager {
  readonly driverName: string;
  /** Pure factory for a fresh save (not persisted). */
  createNewGame(): GameSave;
  loadGame(): Promise<LoadResult>;
  saveGame(save: GameSave): Promise<void>;
  /** Wipes progress. Audio/text settings survive unless `keepSettings` is false. */
  resetGame(options?: { keepSettings?: boolean }): Promise<GameSave>;
  /** Boot helper: load, or create and persist a new game (backing up corrupt data). */
  loadOrCreateGame(): Promise<BootResult>;
}

export interface SaveManagerOptions {
  driver: StorageDriver;
  clock: Clock;
  key?: string;
  /** Overridable for migration tests; production always uses the defaults. */
  migrations?: MigrationTable;
  targetVersion?: number;
}

export function createSaveManager({
  driver,
  clock,
  key = SAVE_STORAGE_KEY,
  migrations = MIGRATIONS,
  targetVersion = SAVE_VERSION,
}: SaveManagerOptions): SaveManager {
  const createNewGame = () => createInitialSave(clock.now());

  async function loadGame(): Promise<LoadResult> {
    const raw = await driver.getItem(key);
    if (raw === null) return { status: 'empty' };
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isRawSave(parsed)) return { status: 'corrupt', reason: 'Not a save object' };
      const { save, migratedFrom } = migrateSave(parsed, targetVersion, migrations);
      return { status: 'loaded', save: normalizeSave(save, clock.now()), migratedFrom };
    } catch (error) {
      return { status: 'corrupt', reason: error instanceof Error ? error.message : String(error) };
    }
  }

  async function saveGame(save: GameSave): Promise<void> {
    await driver.setItem(key, JSON.stringify(save));
  }

  async function resetGame({ keepSettings = true } = {}): Promise<GameSave> {
    const previous = keepSettings ? await loadGame() : null;
    const fresh =
      previous?.status === 'loaded'
        ? createInitialSave(clock.now(), previous.save.settings)
        : createNewGame();
    await saveGame(fresh);
    return fresh;
  }

  async function loadOrCreateGame(): Promise<BootResult> {
    const result = await loadGame();
    if (result.status === 'loaded') {
      if (result.migratedFrom !== null) await saveGame(result.save);
      return { save: result.save, source: 'loaded' };
    }
    if (result.status === 'corrupt') {
      const raw = await driver.getItem(key);
      if (raw !== null) await driver.setItem(CORRUPT_BACKUP_KEY, raw);
    }
    const fresh = createNewGame();
    await saveGame(fresh);
    return { save: fresh, source: result.status === 'corrupt' ? 'recovered' : 'new' };
  }

  return {
    driverName: driver.name,
    createNewGame,
    loadGame,
    saveGame,
    resetGame,
    loadOrCreateGame,
  };
}

function isRawSave(value: unknown): value is RawSave {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { version?: unknown }).version === 'number'
  );
}

/**
 * Defensive merge with defaults after migration: missing sections are filled
 * in and an unknown scene id falls back to the initial scene. Deep validation
 * of every field is intentionally out of scope (single trusted player).
 */
function normalizeSave(raw: RawSave, now: Date): GameSave {
  const defaults = createInitialSave(now);
  const merged = { ...defaults } as Record<string, unknown>;
  for (const [section, defaultValue] of Object.entries(defaults)) {
    const value = raw[section];
    if (value === undefined) continue;
    merged[section] =
      isPlainObject(defaultValue) && isPlainObject(value) ? { ...defaultValue, ...value } : value;
  }
  const save = merged as unknown as GameSave;
  if (!isSceneId(save.progress.sceneId)) {
    save.progress = { ...save.progress, sceneId: INITIAL_SCENE, checkpoint: null };
  }
  return save;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
