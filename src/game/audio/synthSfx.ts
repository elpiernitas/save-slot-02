import type { SfxId, VoiceId } from './types';

/**
 * Tiny procedurally generated UI sounds (square/triangle beeps). No audio
 * files, no third-party assets: every sound is described here as notes.
 */
export interface SynthNote {
  /** Hz */
  frequency: number;
  /** Seconds */
  duration: number;
  wave: OscillatorType;
  /** 0–1 before channel volume. Keep low: square waves are loud. */
  gain: number;
}

export const SYNTH_SFX: Readonly<Record<SfxId, readonly SynthNote[]>> = {
  cursor: [{ frequency: 1320, duration: 0.03, wave: 'square', gain: 0.05 }],
  confirm: [
    { frequency: 880, duration: 0.045, wave: 'square', gain: 0.06 },
    { frequency: 1320, duration: 0.07, wave: 'square', gain: 0.06 },
  ],
  cancel: [
    { frequency: 660, duration: 0.045, wave: 'square', gain: 0.05 },
    { frequency: 440, duration: 0.07, wave: 'square', gain: 0.05 },
  ],
  boot: [
    { frequency: 196, duration: 0.09, wave: 'triangle', gain: 0.12 },
    { frequency: 294, duration: 0.09, wave: 'triangle', gain: 0.12 },
    { frequency: 392, duration: 0.16, wave: 'triangle', gain: 0.12 },
  ],
  blip: [{ frequency: 740, duration: 0.02, wave: 'square', gain: 0.03 }],
};

export function sfxDuration(notes: readonly SynthNote[]): number {
  return notes.reduce((total, note) => total + note.duration, 0);
}

/**
 * Dialogue voices: one short note per blip. A speaker's `voice` picks one;
 * unknown ids fall back to `default`. Pitch wobbles slightly between blips
 * (deterministic cycle) so speech doesn't sound like a single beep.
 */
export const VOICE_BLIPS: Readonly<Record<VoiceId, SynthNote>> = {
  default: { frequency: 740, duration: 0.028, wave: 'square', gain: 0.03 },
  archivist: { frequency: 330, duration: 0.035, wave: 'square', gain: 0.035 },
  system: { frequency: 1480, duration: 0.02, wave: 'triangle', gain: 0.05 },
  narrator: { frequency: 520, duration: 0.025, wave: 'triangle', gain: 0.03 },
};

export const VOICE_PITCH_CYCLE = [1, 1.06, 0.96, 1.03] as const;

export function voiceNote(voice: VoiceId, blipIndex: number): SynthNote {
  const base = VOICE_BLIPS[voice] ?? VOICE_BLIPS.default!;
  const factor = VOICE_PITCH_CYCLE[blipIndex % VOICE_PITCH_CYCLE.length]!;
  return { ...base, frequency: Math.round(base.frequency * factor) };
}
