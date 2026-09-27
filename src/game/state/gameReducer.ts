import type { AchievementId } from '../achievements/types';
import { isDateOptionId, type DateOptionId } from '../calendar';
import { cardDefinition } from '../content/cards';
import { itemDefinition } from '../content/items';
import { puzzleDefinition } from '../puzzles/registry';
import { giveCard, giveItem, markCardSeen, takeItem } from '../inventory/inventory';
import type { CardId, ItemId } from '../inventory/types';
import { INITIAL_SCENE, isResumableScene, type SceneId } from '../scenes/sceneIds';
import type {
  ChoiceId,
  FlagId,
  PuzzleId,
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
  /** Post-game and other one-time content unlocks; first grant wins. */
  | { type: 'unlock/grant'; unlock: string; at: string }
  | { type: 'settings/update'; settings: SettingsPatch; at: string }
  /**
   * Assigns the player's class and marks classSelect as completed. A class
   * is permanent for the playthrough: if one is already set this is a no-op
   * (only a game reset clears it).
   */
  | { type: 'player/assignClass'; classId: PlayerClassId; at: string }
  /** Inventory (GAME-05). Unknown ids are content errors: no-op here, caught by tests. */
  | { type: 'item/give'; item: ItemId; quantity?: number; at: string }
  | { type: 'item/take'; item: ItemId; quantity?: number; at: string }
  /** CITY CARDS: first acquisition only; `markSeen` clears the NEW badge. */
  | { type: 'card/give'; card: CardId; at: string }
  | { type: 'card/markSeen'; card: CardId; at: string }
  /** GAME-06: first completion wins; attempts are runtime-only until then (min 1). */
  | { type: 'puzzle/complete'; puzzle: PuzzleId; attempts: number; at: string }
  /** GAME-07: one per real encounter start (no-op once defeated); first defeat wins. */
  | { type: 'boss/attempt'; at: string }
  | { type: 'boss/defeat'; at: string }
  /** GAME-08: first confirmed route wins; later choices never overwrite it. */
  | { type: 'date/choose'; option: DateOptionId; at: string }
  /** GAME-09: first completion wins. */
  | { type: 'game/complete'; at: string }
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

    case 'unlock/grant':
      // Unlocks are deliberately generic: the content layer decides what an
      // unlock means, while the save only records its first grant timestamp.
      if (Object.hasOwn(save.unlocks, action.unlock)) return save;
      return touch(
        {
          ...save,
          unlocks: { ...save.unlocks, [action.unlock]: { unlockedAt: action.at } },
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

    case 'item/give': {
      const definition = itemDefinition(action.item);
      if (!definition) return save;
      const inventory = giveItem(save.inventory, definition, action.quantity ?? 1, action.at);
      return inventory === save.inventory ? save : touch({ ...save, inventory }, action.at);
    }

    case 'item/take': {
      const inventory = takeItem(save.inventory, action.item, action.quantity ?? 1);
      return inventory === save.inventory ? save : touch({ ...save, inventory }, action.at);
    }

    case 'card/give': {
      if (!cardDefinition(action.card)) return save;
      const cards = giveCard(save.cards, action.card, action.at);
      return cards === save.cards ? save : touch({ ...save, cards }, action.at);
    }

    case 'card/markSeen': {
      const cards = markCardSeen(save.cards, action.card);
      return cards === save.cards ? save : touch({ ...save, cards }, action.at);
    }

    case 'puzzle/complete':
      if (!puzzleDefinition(action.puzzle) || Object.hasOwn(save.puzzles, action.puzzle))
        return save;
      return touch(
        {
          ...save,
          puzzles: {
            ...save.puzzles,
            [action.puzzle]: {
              completedAt: action.at,
              attempts: Math.max(1, Math.floor(action.attempts)),
            },
          },
        },
        action.at,
      );

    case 'boss/attempt':
      if (save.boss.defeated) return save;
      return touch(
        { ...save, boss: { ...save.boss, attempts: save.boss.attempts + 1 } },
        action.at,
      );

    case 'boss/defeat':
      if (save.boss.defeated) return save;
      return touch(
        {
          ...save,
          boss: {
            defeated: true,
            attempts: Math.max(1, save.boss.attempts),
            defeatedAt: action.at,
          },
        },
        action.at,
      );

    case 'date/choose':
      if (save.dateQuest.chosenOptionId !== null || !isDateOptionId(action.option)) return save;
      return touch(
        { ...save, dateQuest: { chosenOptionId: action.option, chosenAt: action.at } },
        action.at,
      );
    case 'game/complete':
      // A completed save always carries a date route (GAME_09_SPEC §13).
      if (save.timestamps.completedAt !== null || save.dateQuest.chosenOptionId === null) {
        return save;
      }
      return touch(
        { ...save, timestamps: { ...save.timestamps, completedAt: action.at } },
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
