import type { IsoTimestamp } from '../../types/common';

export type AchievementId = string;

/** Static achievement content. Defined from GAME-05/GAME-11 onwards. */
export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  /** Hidden achievements show "???" until unlocked. */
  hidden: boolean;
  icon?: string;
}

export interface AchievementUnlock {
  unlockedAt: IsoTimestamp;
}
