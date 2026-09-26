/**
 * GAME-11 music: one original five-note motif, transformed per context
 * (GAME_11_SPEC §5). Pure data — the Web Audio engine schedules it. No
 * samples, no third-party material, nothing imitating an existing song.
 */
import type { SceneId } from '../scenes/sceneIds';
import type { TrackId } from './types';

/** Scale degrees of the motif (0 = tonic). */
export const MOTIF = [0, 2, 4, 3, 1] as const;

export interface MusicVoice {
  wave: OscillatorType;
  /** Peak gain before the music channel volume. Keep it quiet. */
  gain: number;
  /** Note length in steps. */
  length: number;
  /** One entry per step: MIDI note or null (rest). Loops. */
  pattern: readonly (number | null)[];
}

export interface MusicTrack {
  /** Steps per minute ÷ 4 (a step is a sixteenth). */
  bpm: number;
  voices: readonly MusicVoice[];
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

const note = (root: number, scale: readonly number[], degree: number) =>
  root + scale[((degree % 7) + 7) % 7]! + 12 * Math.floor(degree / 7);

/** Places `notes` on `steps` of an empty `length`-step bar. */
function bar(length: number, steps: readonly number[], notes: readonly number[]) {
  const out: (number | null)[] = Array.from({ length }, () => null);
  steps.forEach((s, i) => (out[s] = notes[i % notes.length]!));
  return out;
}

const motif = (root: number, scale: readonly number[], shift = 0) =>
  MOTIF.map((d) => note(root, scale, d + shift));

export const TRACKS: Readonly<Record<string, MusicTrack>> = {
  /** Boot, title, class select: sparse, low pulse. */
  system: {
    bpm: 72,
    voices: [
      { wave: 'triangle', gain: 0.05, length: 6, pattern: bar(32, [0, 16], [45, 43]) },
      {
        wave: 'sine',
        gain: 0.025,
        length: 3,
        pattern: bar(32, [0, 6, 12, 18, 24], motif(69, MAJOR)),
      },
    ],
  },
  /** La Muralla, afternoon: warm pluck, light bass. */
  muralla_afternoon: {
    bpm: 96,
    voices: [
      {
        wave: 'triangle',
        gain: 0.035,
        length: 2,
        pattern: bar(
          32,
          [0, 3, 6, 8, 10, 16, 19, 22, 24, 28],
          [...motif(72, MAJOR), ...motif(72, MAJOR, 2)],
        ),
      },
      { wave: 'sine', gain: 0.05, length: 3, pattern: bar(32, [0, 8, 16, 24], [48, 55, 53, 55]) },
    ],
  },
  /** DESYNC PROCESS: syncopated, tense, not horror. */
  desync: {
    bpm: 120,
    voices: [
      {
        wave: 'triangle',
        gain: 0.05,
        length: 2,
        pattern: bar(16, [0, 3, 6, 10, 12], [45, 45, 48, 44, 43]),
      },
      {
        wave: 'square',
        gain: 0.012,
        length: 1,
        pattern: bar(32, [2, 5, 7, 18, 21, 23], motif(69, MINOR)),
      },
    ],
  },
  /** Reveal, date gate, ending, save slot: slow and clean. */
  ending: {
    bpm: 66,
    voices: [
      {
        wave: 'sine',
        gain: 0.04,
        length: 5,
        pattern: bar(32, [0, 6, 12, 16, 24], motif(72, MAJOR)),
      },
      { wave: 'triangle', gain: 0.035, length: 14, pattern: bar(32, [0, 16], [48, 53]) },
    ],
  },
};

/** Central scene → track routing (GAME_11_SPEC §8). Null = silence. */
export function musicForScene(scene: SceneId): TrackId | null {
  switch (scene) {
    case 'boot':
    case 'saveDetected':
    case 'title':
    case 'classSelect':
      return 'system';
    case 'overworld':
    case 'dungeon':
      return 'muralla_afternoon';
    case 'boss':
      return 'desync';
    case 'player2Reveal':
    case 'dateGate':
    case 'ending':
    case 'saveSlot':
      return 'ending';
    case 'systemCheck':
    case 'dialogueDemo':
      return null;
  }
}

export const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export const stepSeconds = (track: MusicTrack) => 60 / track.bpm / 4;
