/**
 * Minimal async key/value contract the save layer depends on.
 *
 * It is async on purpose even though localStorage is sync: a future remote
 * backend (e.g. Supabase) can implement the same interface without changing
 * any caller. See docs/DECISION_LOG.md (D-007).
 */
export interface StorageDriver {
  /** Human-readable name for logs/debug UI. */
  readonly name: string;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** In-memory driver: tests, and fallback when Web Storage is unavailable. */
export function createMemoryStorageDriver(initial: Record<string, string> = {}): StorageDriver {
  const data = new Map(Object.entries(initial));
  return {
    name: 'memory',
    getItem: (key) => Promise.resolve(data.get(key) ?? null),
    setItem: (key, value) => {
      data.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      data.delete(key);
      return Promise.resolve();
    },
  };
}
