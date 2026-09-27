import { SAVE_VERSION } from '../state/types';

/**
 * A migration upgrades a raw save from version N to N+1. Raw saves are
 * `Record<string, unknown>` on purpose: old shapes have no types anymore.
 *
 * To change the save shape:
 *  1. bump SAVE_VERSION in src/game/state/types.ts
 *  2. add `[oldVersion]: (raw) => ({ ...raw, version: oldVersion + 1, ... })`
 *  3. add a test in migrations.test.ts with a real old fixture
 */
export type RawSave = Record<string, unknown> & { version: number };
export type Migration = (raw: RawSave) => RawSave;
export type MigrationTable = Readonly<Record<number, Migration>>;

/**
 * Migrations are frozen snapshots: never import current types or helpers that
 * may change later; describe the old → new shape literally.
 */
export const MIGRATIONS: MigrationTable = {
  /**
   * v1 → v2 (GAME-01): adds `system` (boot/session flags) and
   * `progress.resumeSceneId`. v1 only ever reached start-up scenes, so there
   * is no gameplay scene to resume and the boot intro counts as not seen.
   */
  1: (raw) => {
    const progress = isRecord(raw.progress) ? raw.progress : {};
    return {
      ...raw,
      version: 2,
      progress: { ...progress, resumeSceneId: null },
      system: { bootCompletedAt: null, enteredGameAt: null, sessionCount: 0, lastSessionAt: null },
    };
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class SaveMigrationError extends Error {
  override name = 'SaveMigrationError';
}

export function migrateSave(
  raw: RawSave,
  targetVersion: number = SAVE_VERSION,
  migrations: MigrationTable = MIGRATIONS,
): { save: RawSave; migratedFrom: number | null } {
  const from = raw.version;
  if (!Number.isInteger(from) || from < 1) {
    throw new SaveMigrationError(`Invalid save version: ${String(from)}`);
  }
  if (from > targetVersion) {
    // Written by a newer build (e.g. cached old bundle). Never downgrade silently.
    throw new SaveMigrationError(`Save version ${from} is newer than supported ${targetVersion}`);
  }

  let current = raw;
  while (current.version < targetVersion) {
    const step = migrations[current.version];
    if (!step) {
      throw new SaveMigrationError(`Missing migration from version ${current.version}`);
    }
    const next = step(current);
    if (next.version !== current.version + 1) {
      throw new SaveMigrationError(
        `Migration from ${current.version} produced version ${next.version}`,
      );
    }
    current = next;
  }
  return { save: current, migratedFrom: from === targetVersion ? null : from };
}
