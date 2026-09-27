import type { IsoTimestamp } from '../../types/common';

export type QuestId = string;

export type QuestStatus = 'hidden' | 'active' | 'completed' | 'failed';

export interface QuestStep {
  id: string;
  /** Short objective shown in the quest log. */
  objective: string;
}

/** Static quest content. Defined from GAME-04 onwards. */
export interface QuestDefinition {
  id: QuestId;
  title: string;
  steps: readonly QuestStep[];
  /** Hidden quests are not listed until they become active. */
  secret?: boolean;
}

export interface QuestProgress {
  status: QuestStatus;
  /** Index into `QuestDefinition.steps`. */
  stepIndex: number;
  startedAt: IsoTimestamp | null;
  completedAt: IsoTimestamp | null;
}
