import { useEffect } from 'react';
import type { AudioEngine } from '../game/audio/types';

const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchend'] as const;

/**
 * iOS Safari / Chrome mobile block audio until a user gesture. This listens
 * for the first gesture anywhere and unlocks the engine from inside it.
 */
export function useAudioUnlock(engine: AudioEngine): void {
  useEffect(() => {
    if (engine.unlocked) return;
    const remove = () => {
      for (const type of UNLOCK_EVENTS) window.removeEventListener(type, handler, true);
    };
    // Keep listening until the engine really unlocks (a gesture can be refused).
    const handler = () => {
      void engine.unlock().then(() => {
        if (engine.unlocked) remove();
      });
    };
    for (const type of UNLOCK_EVENTS) window.addEventListener(type, handler, true);
    return remove;
  }, [engine]);
}
