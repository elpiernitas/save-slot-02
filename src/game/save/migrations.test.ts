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
