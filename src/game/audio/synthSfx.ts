import type { SfxId } from './types';

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
