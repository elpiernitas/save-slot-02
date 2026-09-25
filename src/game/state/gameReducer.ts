import type { AchievementId } from '../achievements/types';
import { INITIAL_SCENE, isResumableScene, type SceneId } from '../scenes/sceneIds';
import type {
  ChoiceId,
  FlagId,
  FlagValue,
  GameSave,
  GameSettings,
  PlayerClassId,
  SettingsPatch,
} from './types';

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
  /** Finer resume point inside the current gameplay scene (e.g. "muralla:terrace"). */
  | { type: 'progress/checkpoint'; checkpoint: string; at: string }
  | { type: 'flag/set'; flag: FlagId; value: FlagValue; at: string }
  | { type: 'choice/record'; choice: ChoiceId; option: string; at: string }
  | { type: 'achievement/unlock'; achievement: AchievementId; at: string }
  | { type: 'settings/update'; settings: SettingsPatch; at: string }
  /**
   * Assigns the player's class and marks classSelect as completed. A class
   * is permanent for the playthrough: if one is already set this is a no-op
   * (only a game reset clears it).
   */
  | { type: 'player/assignClass'; classId: PlayerClassId; at: string }
  /** Once per page load: counts the session and restarts at the system check. */
  | { type: 'system/sessionStart'; at: string }
  | { type: 'system/bootCompleted'; at: string }
  | { type: 'system/enteredGame'; at: string }
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
            // The checkpoint belongs to the resume scene: it survives trips to
            // the title (or dev scenes) and is only reset when entering a
            // different gameplay scene without an explicit checkpoint.
            checkpoint:
              action.checkpoint !== undefined
                ? action.checkpoint
                : isResumableScene(action.scene) && action.scene !== save.progress.resumeSceneId
                  ? null
                  : save.progress.checkpoint,
            resumeSceneId: isResumableScene(action.scene)
              ? action.scene
              : save.progress.resumeSceneId,
          },
        },
        action.at,
      );

    case 'progress/checkpoint':
      if (save.progress.checkpoint === action.checkpoint) return save;
      return touch(
        { ...save, progress: { ...save.progress, checkpoint: action.checkpoint } },
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
      return touch({ ...save, settings: mergeSettings(save.settings, action.settings) }, action.at);

    case 'player/assignClass':
      if (save.player.classId !== null) return save;
      return touch(
        {
          ...save,
          player: { ...save.player, classId: action.classId },
          progress: {
            ...save.progress,
            completedScenes: save.progress.completedScenes.includes('classSelect')
              ? save.progress.completedScenes
              : [...save.progress.completedScenes, 'classSelect'],
          },
        },
        action.at,
      );

    case 'system/sessionStart':
      return touch(
        {
          ...save,
          // Keep the checkpoint: after the system check, CONTINUE resumes there.
          progress: { ...save.progress, sceneId: INITIAL_SCENE },
          system: {
            ...save.system,
            sessionCount: save.system.sessionCount + 1,
            lastSessionAt: action.at,
          },
        },
        action.at,
      );

    case 'system/bootCompleted':
      if (save.system.bootCompletedAt) return save;
      return touch({ ...save, system: { ...save.system, bootCompletedAt: action.at } }, action.at);

    case 'system/enteredGame':
      if (save.system.enteredGameAt) return save;
      return touch({ ...save, system: { ...save.system, enteredGameAt: action.at } }, action.at);

    case 'save/replace':
      return action.save;
  }
}

/** Deep merge that only overwrites the keys present in the patch. */
export function mergeSettings(current: GameSettings, patch: SettingsPatch): GameSettings {
  return {
    ...current,
    ...(patch.textSpeed !== undefined && { textSpeed: patch.textSpeed }),
    ...(patch.reducedMotion !== undefined && { reducedMotion: patch.reducedMotion }),
    audio: {
      ...current.audio,
      ...(patch.audio?.muted !== undefined && { muted: patch.audio.muted }),
      volume: { ...current.audio.volume, ...patch.audio?.volume },
    },
  };
}
