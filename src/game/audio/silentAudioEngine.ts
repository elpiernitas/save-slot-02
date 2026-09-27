import type { AudioEngine, AudioSettings } from './types';
import { DEFAULT_AUDIO_SETTINGS } from './types';

/**
 * Placeholder engine used until real audio lands in GAME-11. It honours the
 * lock/mute contract so UI code written now keeps working unchanged later.
 */
export function createSilentAudioEngine(): AudioEngine & {
  readonly settings: AudioSettings;
  readonly currentTrack: string | null;
} {
  let unlocked = false;
  let settings = DEFAULT_AUDIO_SETTINGS;
  let currentTrack: string | null = null;

  return {
    get unlocked() {
      return unlocked;
    },
    get settings() {
      return settings;
    },
    get currentTrack() {
      return currentTrack;
    },
    unlock() {
      unlocked = true;
      return Promise.resolve();
    },
    applySettings(next) {
      settings = next;
    },
    playMusic(track) {
      // Muting silences output but keeps the track "playing" so unmute resumes it.
      if (!unlocked) return;
      currentTrack = track;
    },
    stopMusic() {
      currentTrack = null;
    },
    playSfx() {
      // Intentionally silent.
    },
    playVoiceBlip() {
      // Intentionally silent.
    },
  };
}
