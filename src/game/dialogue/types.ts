import type { AchievementId } from '../achievements/types';
import type { SfxId, VoiceId } from '../audio/types';
import type { ItemId, CardId } from '../inventory/types';
import type { QuestId, QuestStatus } from '../quests/types';
import type { SceneId } from '../scenes/sceneIds';
import type { Condition } from '../state/conditions';
import type { ChoiceId, FlagId, FlagValue } from '../state/types';

/**
 * Dialogue contract (data only). The engine that plays these scripts —
 * typewriter, ▼ indicator, input handling, blips — arrives in GAME-02.
 *
 * A script is a small graph of nodes. Everything is plain data so scripts can
 * live in `.ts` content files and be unit-tested without React.
 */

export type DialogueScriptId = string;
export type DialogueNodeId = string;
export type SpeakerId = string;
export type PortraitId = string;
/** Named hook for behaviour that cannot be expressed as data (see `DialogueEffect`). */
export type DialogueActionId = string;

export interface Speaker {
  id: SpeakerId;
  /** Name shown in the name plate. `null` = narrator / no plate. */
  displayName: string | null;
  defaultPortrait?: PortraitId;
  /** Typing blip voice. Omit for silent typing. */
  voice?: VoiceId;
}

/** Free-form expression key ("neutral", "smug"…) resolved against the portrait set. */
export type PortraitExpression = string;

export interface TypewriterOptions {
  /** Overrides the player's text speed setting for this line. */
  charsPerSecond?: number;
  /** Pause (ms) inserted after `.,!?…`. */
  punctuationPauseMs?: number;
  /** Whether a tap may complete the line instantly. Default true. */
  skippable?: boolean;
}

/** State changes a node or choice can trigger. Applied by the engine in order. */
export type DialogueEffect =
  | { kind: 'setFlag'; flag: FlagId; value: FlagValue }
  | { kind: 'giveItem'; item: ItemId; quantity?: number }
  | { kind: 'takeItem'; item: ItemId; quantity?: number }
  | { kind: 'giveCard'; card: CardId }
  | { kind: 'unlockAchievement'; achievement: AchievementId }
  | { kind: 'setQuest'; quest: QuestId; status: QuestStatus }
  | { kind: 'goToScene'; scene: SceneId }
  | { kind: 'playSfx'; sfx: SfxId }
  /** Escape hatch: a callback registered by id (keeps scripts serialisable). */
  | { kind: 'action'; action: DialogueActionId; payload?: unknown };

interface NodeBase {
  id: DialogueNodeId;
  /** Node is skipped (engine follows `next`) when the condition is false. */
  condition?: Condition;
  /** Effects applied when the node is entered. */
  effects?: readonly DialogueEffect[];
}

/** One speech bubble. `pages` are shown one after another in the same box. */
export interface LineNode extends NodeBase {
  type: 'line';
  speaker?: SpeakerId;
  /** Overrides the speaker's default portrait for this line. */
  portrait?: PortraitId | null;
  expression?: PortraitExpression;
  pages: readonly string[];
  typewriter?: TypewriterOptions;
  /** `undefined` = end of script. */
  next?: DialogueNodeId;
}

export interface ChoiceOption {
  id: string;
  label: string;
  next: DialogueNodeId;
  /** Hidden when false (or shown disabled if `showWhenLocked`). */
  condition?: Condition;
  showWhenLocked?: boolean;
  effects?: readonly DialogueEffect[];
}

/** Menu of answers. The picked option id is stored under `recordAs`, if given. */
export interface ChoiceNode extends NodeBase {
  type: 'choice';
  speaker?: SpeakerId;
  prompt?: string;
  options: readonly ChoiceOption[];
  recordAs?: ChoiceId;
  /** Option chosen if the player cancels (e.g. taps outside). Omit = not cancellable. */
  cancelOptionId?: string;
}

/** Invisible routing node: first matching branch wins, `fallback` otherwise. */
export interface BranchNode extends NodeBase {
  type: 'branch';
  branches: readonly { when: Condition; next: DialogueNodeId }[];
  fallback?: DialogueNodeId;
}

/** Runs effects only (no UI) then continues. */
export interface EffectNode extends NodeBase {
  type: 'effect';
  next?: DialogueNodeId;
}

export type DialogueNode = LineNode | ChoiceNode | BranchNode | EffectNode;

export interface DialogueScript {
  id: DialogueScriptId;
  start: DialogueNodeId;
  nodes: Readonly<Record<DialogueNodeId, DialogueNode>>;
  /** Speakers used by this script (merged with the global cast). */
  speakers?: readonly Speaker[];
}

/** What the future engine exposes to the UI at any moment. */
export type DialogueRuntimeState =
  | { status: 'idle' }
  | {
      status: 'typing' | 'waiting';
      scriptId: DialogueScriptId;
      node: LineNode;
      pageIndex: number;
      /** Characters currently revealed (typewriter). */
      visibleChars: number;
    }
  | {
      status: 'choosing';
      scriptId: DialogueScriptId;
      node: ChoiceNode;
      availableOptions: readonly ChoiceOption[];
      highlighted: number;
    }
  | { status: 'finished'; scriptId: DialogueScriptId };
