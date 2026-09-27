import type { AchievementId } from '../achievements/types';
import { getDateOption, isTimeGateOpen, type TimeGate } from '../calendar';
import type { ItemId } from '../inventory/types';
import type { QuestId, QuestStatus } from '../quests/types';
import type { ChoiceId, FlagId, FlagValue, GameSave, PlayerClassId, PuzzleId } from './types';

/**
 * Declarative, serialisable conditions shared by dialogue, scenes, quests and
 * unlocks. Content files describe *what* must be true; this module decides.
 */
export type Condition =
  | { kind: 'flag'; flag: FlagId; equals?: FlagValue }
  | { kind: 'choice'; choice: ChoiceId; option: string }
  | { kind: 'hasItem'; item: ItemId; min?: number }
  | { kind: 'achievement'; achievement: AchievementId }
  | { kind: 'quest'; quest: QuestId; status: QuestStatus }
  | { kind: 'puzzleCompleted'; puzzle: PuzzleId }
  | { kind: 'bossDefeated' }
  | { kind: 'dateChosen' }
  /** Class-specific content (GAME-03): exclusive lines, alternative options… */
  | { kind: 'playerClass'; classId: PlayerClassId }
  | { kind: 'time'; gate: TimeGate }
  | { kind: 'not'; condition: Condition }
  | { kind: 'all'; conditions: readonly Condition[] }
  | { kind: 'any'; conditions: readonly Condition[] };

export interface ConditionContext {
  save: GameSave;
  /** Always injected (from a Clock) so evaluation stays pure and testable. */
  now: Date;
}

export function evaluateCondition(condition: Condition, ctx: ConditionContext): boolean {
  const { save } = ctx;
  switch (condition.kind) {
    case 'flag': {
      const value = save.flags[condition.flag];
      return condition.equals === undefined ? Boolean(value) : value === condition.equals;
    }
    case 'choice':
      return save.choices[condition.choice] === condition.option;
    case 'hasItem':
      return (save.inventory.items[condition.item]?.quantity ?? 0) >= (condition.min ?? 1);
    case 'achievement':
      return Object.hasOwn(save.achievements, condition.achievement);
    case 'quest':
      return (save.quests[condition.quest]?.status ?? 'hidden') === condition.status;
    case 'puzzleCompleted':
      return Object.hasOwn(save.puzzles, condition.puzzle);
    case 'bossDefeated':
      return save.boss.defeated;
    case 'dateChosen':
      return save.dateQuest.chosenOptionId !== null;
    case 'playerClass':
      return save.player.classId === condition.classId;
    case 'time':
      return isTimeGateOpen(condition.gate, {
        now: ctx.now,
        chosenDateKey: save.dateQuest.chosenOptionId
          ? getDateOption(save.dateQuest.chosenOptionId).dateKey
          : null,
      });
    case 'not':
      return !evaluateCondition(condition.condition, ctx);
    case 'all':
      return condition.conditions.every((c) => evaluateCondition(c, ctx));
    case 'any':
      return condition.conditions.some((c) => evaluateCondition(c, ctx));
  }
}
