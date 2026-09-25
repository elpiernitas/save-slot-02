/**
 * Audio contract. No real assets exist yet (GAME-11). Ids are plain strings
 * so content can register tracks/sfx without touching the engine.
 */
export type TrackId = string;
export type SfxId = string;
/** A dialogue "blip" voice, e.g. one per speaker. */
export type VoiceId = string;

export type AudioChannel = 'music' | 'sfx' | 'voice';

export interface AudioSettings {
  muted: boolean;
  /** 0–1 per channel. */
  volume: Record<AudioChannel, number>;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  volume: { music: 0.6, sfx: 0.8, voice: 0.5 },
};

/**
 * Mobile browsers only allow audio after a user gesture. The engine starts
 * "locked"; the UI must call `unlock()` from inside a tap/keydown handler
 * (see `useAudioUnlock`). Every play call before that is silently ignored.
 */
export interface AudioEngine {
  readonly unlocked: boolean;
  unlock(): Promise<void>;
  applySettings(settings: AudioSettings): void;
  playMusic(track: TrackId, options?: { loop?: boolean; fadeMs?: number }): void;
  stopMusic(options?: { fadeMs?: number }): void;
  playSfx(sfx: SfxId): void;
  playVoiceBlip(voice: VoiceId): void;
}
