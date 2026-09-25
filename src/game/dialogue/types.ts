import type { AchievementId } from '../achievements/types';
import type { SfxId, VoiceId } from '../audio/types';
import type { ItemId, CardId } from '../inventory/types';
import type { QuestId, QuestStatus } from '../quests/types';
import type { SceneId } from '../scenes/sceneIds';
import type { Condition } from '../state/conditions';
import type { ChoiceId, FlagId, FlagValue } from '../state/types';

/**
 * Dialogue contract (data only). A script is a small graph of nodes; all of
 * it is plain serialisable data (no functions, no JSX) so scripts live in
 * `.ts` content files, can be validated (`validateDialogueScript`) and run
 * by the pure runtime (`runtime.ts`) without React.
 *
 * Page text uses the tiny markup described in `markup.ts`
 * ([em] [shake] [sys] [slow] [fast] [pause]).
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
  /** Visual tone of the name plate and text. `system` = terminal green. */
  tone?: 'default' | 'system';
}

/** Free-form expression key ("neutral", "smug"…) resolved against the portrait set. */
export type PortraitExpression = string;

export interface TypewriterOptions {
  /**
   * Multiplies the per-character delay of the player's text speed for this
   * line (2 = twice as slow). Speeds themselves are centralised in
   * `typewriter.ts`; scripts never hard-code characters per second.
   */
  delayMultiplier?: number;
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
  /** Stores a choice explicitly (ChoiceNode.recordAs emits this too). */
  | { kind: 'recordChoice'; choice: ChoiceId; option: string }
  /**
   * Escape hatch: a handler registered by id in a `DialogueActionRegistry`.
   * Scripts only carry the id + JSON payload; functions never live in data.
   */
  | { kind: 'action'; action: DialogueActionId; payload?: unknown };

interface NodeBase {
  id: DialogueNodeId;
  /**
   * When false the node is skipped entirely (no effects, no UI) and the
   * runtime continues at `skipTo`, or else at the node's `next` / `fallback`,
   * or else the dialogue ends.
   */
  condition?: Condition;
  skipTo?: DialogueNodeId;
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
  /** Each page must fit the box (max 3 short lines). See `validate.ts`. */
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
  portrait?: PortraitId | null;
  expression?: PortraitExpression;
  /** Shown (typed) in the dialogue box while the menu is open. Markup allowed. */
  prompt?: string;
  options: readonly ChoiceOption[];
  recordAs?: ChoiceId;
  /** Option chosen when the player presses Escape. Omit = not cancellable. */
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
