import { createFullscreenController } from '../lib/fullscreen';
import { systemClock } from '../lib/time';
import { createWebAudioEngine } from '../game/audio';
import { createLocalStorageDriver, createSaveManager } from '../game/save';
import type { GameServices } from '../game/state';

/** Production wiring. Swap pieces here (e.g. a Supabase driver) — nowhere else. */
export function createDefaultServices(): GameServices {
  const clock = systemClock;
  return {
    clock,
    saveManager: createSaveManager({ driver: createLocalStorageDriver(), clock }),
    audio: createWebAudioEngine(),
    fullscreen: createFullscreenController(),
  };
}
