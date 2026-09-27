import { TERMINAL_ID } from '../puzzles/chapter';
import type { SceneId } from '../scenes/sceneIds';
import type { GameSave } from '../state/types';
import { COMPRESSED_BEATS, FULL_BEATS, GATE_BEATS, type Beat } from './reveal/beats';

/** GAME-07 story flags (generic flags; no new save fields). */
export const STORY_FLAGS = {
  /** Reveal seen through the human line (set when PARTY STATUS — 2/2 shows). */
  player2Found: 'story.player2Found',
  /** Cooperative gate opened: GAME-07 complete, GAME-08 may start. */
  player2GateComplete: 'story.player2GateComplete',
} as const;

/**
 * Where the story must be, judged from what the save proves is done
 * (TECHNICAL_CONTRACT §4). Null = no GAME-07 stage yet: use the normal
 * resume point. A refresh can therefore never replay a finished boss.
 */
export function storyScene(save: GameSave): SceneId | null {
  if (save.timestamps.completedAt) return 'saveSlot';
  if (save.dateQuest.chosenOptionId) return 'ending';
  if (save.flags[STORY_FLAGS.player2GateComplete]) return 'dateGate';
  if (save.boss.defeated) return 'player2Reveal';
  if (Object.hasOwn(save.puzzles, TERMINAL_ID)) return 'boss';
  return null;
}

/**
 * Which reveal to stage. The full one only right after the fight in this
 * page load; a refresh mid-reveal gets the compressed one (no boss replay),
 * and once PLAYER 2 is found, only the gate remains.
 */
export function revealBeats(save: GameSave, freshDefeat: boolean): readonly Beat[] {
  if (save.flags[STORY_FLAGS.player2Found]) return GATE_BEATS;
  return freshDefeat ? FULL_BEATS : COMPRESSED_BEATS;
}

/** Set by the boss scene when it wins in this page load (runtime only). */
let freshDefeat = false;
export const markFreshDefeat = () => {
  freshDefeat = true;
};
export const isFreshDefeat = () => freshDefeat;
/** Cleared once the reveal has been seen, so a later re-entry is shorter. */
export const clearFreshDefeat = () => {
  freshDefeat = false;
};
