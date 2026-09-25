import { createMemoryStorageDriver, type StorageDriver } from './storageDriver';

/**
 * The ONLY module allowed to touch `window.localStorage` (enforced by ESLint).
 *
 * Falls back to memory when storage is blocked (some private-browsing modes,
 * disabled cookies) so the game remains playable, just without persistence.
 */
export function createLocalStorageDriver(): StorageDriver {
  const storage = getLocalStorage();
  if (!storage) {
    return { ...createMemoryStorageDriver(), name: 'memory (localStorage unavailable)' };
  }
  return {
    name: 'localStorage',
    getItem: (key) => Promise.resolve(storage.getItem(key)),
    setItem: (key, value) => {
      // May throw QuotaExceededError; the save manager reports it.
      storage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      storage.removeItem(key);
      return Promise.resolve();
    },
  };
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = '__save_slot_02_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}
