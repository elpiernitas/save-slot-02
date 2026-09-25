import type { IsoTimestamp } from '../../types/common';
import type { AchievementId, AchievementUnlock } from '../achievements/types';
import type { AudioSettings } from '../audio/types';
import type { DateOptionId } from '../calendar';
import type { CardCollectionState, InventoryState } from '../inventory/types';
import type { QuestId, QuestProgress } from '../quests/types';
import type { SceneId } from '../scenes/sceneIds';

/**
 * Bump when the shape of `GameSave` changes and add a migration in
 * `src/game/save/migrations.ts`. Never edit a released shape in place.
 */
export const SAVE_VERSION = 2;

export type FlagId = string;
export type FlagValue = boolean | number | string;
export type ChoiceId = string;
export type PuzzleId = string;
export type UnlockId = string;

/** Provisional. GAME-03 will narrow this to the real class ids. */
export type PlayerClassId = string;

export interface PlayerState {
  name: string | null;
  classId: PlayerClassId | null;
}

export interface ProgressState {
  sceneId: SceneId;
  /** Optional finer-grained position inside the scene (map id, room, step…). */
  checkpoint: string | null;
  /** Scenes the player has fully cleared, in completion order. */
  completedScenes: SceneId[];
  /** Last gameplay (non start-up) scene visited: where CONTINUE resumes. v2+. */
  resumeSceneId: SceneId | null;
}

/** Start-up / meta state (v2+). Drives which intro screens are skipped. */
export interface SystemState {
  /** First time the boot + save-detection intro was completed. Skips it afterwards. */
  bootCompletedAt: IsoTimestamp | null;
  /** First time the player chose CONTINUE on the title screen. */
  enteredGameAt: IsoTimestamp | null;
  /** Number of times the game has been opened (incremented on load). */
  sessionCount: number;
  lastSessionAt: IsoTimestamp | null;
}

export interface PuzzleResult {
  completedAt: IsoTimestamp;
  attempts: number;
}

export interface BossState {
  defeated: boolean;
  attempts: number;
  defeatedAt: IsoTimestamp | null;
}

/** The secret date: the reward at the end of the game, not its visible goal. */
export interface DateQuestState {
  chosenOptionId: DateOptionId | null;
  chosenAt: IsoTimestamp | null;
}

export interface GameTimestamps {
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  lastPlayedAt: IsoTimestamp;
  completedAt: IsoTimestamp | null;
}

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';

export interface GameSettings {
  audio: AudioSettings;
  textSpeed: TextSpeed;
  /** `system` follows `prefers-reduced-motion`. */
  reducedMotion: 'system' | 'on' | 'off';
}

/**
 * The whole persistent state of one playthrough. Must stay JSON-serialisable
 * (no Date, Map, Set, class instances or functions).
 */
export interface GameSave {
  version: number;
  player: PlayerState;
  progress: ProgressState;
  /** Narrative flags ("metBirdo", "doorOpened"…). */
  flags: Record<FlagId, FlagValue>;
  /** Choice id → chosen option id. */
  choices: Record<ChoiceId, string>;
  inventory: InventoryState;
  cards: CardCollectionState;
  achievements: Record<AchievementId, AchievementUnlock>;
  puzzles: Record<PuzzleId, PuzzleResult>;
  boss: BossState;
  quests: Record<QuestId, QuestProgress>;
  dateQuest: DateQuestState;
  /** Post-game / time-based unlocks (GAME-10). */
  unlocks: Record<UnlockId, { unlockedAt: IsoTimestamp }>;
  timestamps: GameTimestamps;
  settings: GameSettings;
  system: SystemState;
}
