import { DEFAULT_AUDIO_SETTINGS } from '../audio/types';
import { INITIAL_SCENE } from '../scenes/sceneIds';
import { SAVE_VERSION, type GameSave, type GameSettings } from './types';

export const DEFAULT_SETTINGS: GameSettings = {
  audio: DEFAULT_AUDIO_SETTINGS,
  textSpeed: 'normal',
  reducedMotion: 'system',
};

/** A pristine save for a brand-new playthrough. Pure: time is passed in. */
export function createInitialSave(now: Date, settings: GameSettings = DEFAULT_SETTINGS): GameSave {
  const iso = now.toISOString();
  return {
    version: SAVE_VERSION,
    player: { name: null, classId: null },
    progress: {
      sceneId: INITIAL_SCENE,
      checkpoint: null,
      completedScenes: [],
      resumeSceneId: null,
    },
    flags: {},
    choices: {},
    inventory: { items: {} },
    cards: { owned: {} },
    achievements: {},
    puzzles: {},
    boss: { defeated: false, attempts: 0, defeatedAt: null },
    quests: {},
    dateQuest: { chosenOptionId: null, chosenAt: null },
    unlocks: {},
    timestamps: { createdAt: iso, updatedAt: iso, lastPlayedAt: iso, completedAt: null },
    settings: structuredClone(settings),
    system: { bootCompletedAt: null, enteredGameAt: null, sessionCount: 0, lastSessionAt: null },
  };
}
