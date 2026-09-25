import type { AchievementId } from '../achievements/types';
import type { SceneId } from '../scenes/sceneIds';
import type { ChoiceId, FlagId, FlagValue, GameSave, GameSettings } from './types';

/**
 * The only way the running game mutates its save. Every action carries its own
 * timestamp (`at`) so the reducer stays pure and deterministic.
 *
 * GAME-00 ships the generic actions only; mechanics (inventory, quests, boss,
 * date choice…) add their own actions in their phases.
 */
export type GameAction =
  | { type: 'scene/goTo'; scene: SceneId; checkpoint?: string | null; at: string }
  | { type: 'scene/complete'; scene: SceneId; at: string }
  | { type: 'flag/set'; flag: FlagId; value: FlagValue; at: string }
  | { type: 'choice/record'; choice: ChoiceId; option: string; at: string }
  | { type: 'achievement/unlock'; achievement: AchievementId; at: string }
  | { type: 'settings/update'; settings: Partial<GameSettings>; at: string }
  /** Replace the whole save (load, reset, debug). */
  | { type: 'save/replace'; save: GameSave };

function touch(save: GameSave, at: string): GameSave {
  return {
    ...save,
    timestamps: { ...save.timestamps, updatedAt: at, lastPlayedAt: at },
  };
}

export function gameReducer(save: GameSave, action: GameAction): GameSave {
  switch (action.type) {
    case 'scene/goTo':
      return touch(
        {
          ...save,
          progress: {
            ...save.progress,
            sceneId: action.scene,
            checkpoint: action.checkpoint ?? null,
          },
        },
        action.at,
      );

    case 'scene/complete':
      if (save.progress.completedScenes.includes(action.scene)) return save;
      return touch(
        {
          ...save,
          progress: {
            ...save.progress,
            completedScenes: [...save.progress.completedScenes, action.scene],
          },
        },
        action.at,
      );

    case 'flag/set':
      if (save.flags[action.flag] === action.value) return save;
      return touch({ ...save, flags: { ...save.flags, [action.flag]: action.value } }, action.at);

    case 'choice/record':
      return touch(
        { ...save, choices: { ...save.choices, [action.choice]: action.option } },
        action.at,
      );

    case 'achievement/unlock':
      // First unlock wins: keep the original timestamp.
      if (Object.hasOwn(save.achievements, action.achievement)) return save;
      return touch(
        {
          ...save,
          achievements: { ...save.achievements, [action.achievement]: { unlockedAt: action.at } },
        },
        action.at,
      );

    case 'settings/update':
      return touch({ ...save, settings: { ...save.settings, ...action.settings } }, action.at);

    case 'save/replace':
      return action.save;
  }
}
