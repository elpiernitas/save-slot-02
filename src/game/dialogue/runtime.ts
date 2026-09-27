import type { Condition } from '../state/conditions';
import type {
  ChoiceNode,
  ChoiceOption,
  DialogueEffect,
  DialogueNode,
  DialogueNodeId,
  DialogueScript,
} from './types';

/**
 * Pure dialogue runtime. No React, no timers, no globals: given a script, a
 * state and a host (condition evaluator + effect sink) it returns the next
 * state. Deterministic, so every rule is unit-tested.
 *
 * Visible states are `line` (a page waiting to be read) and `choice`
 * (a menu). Branch/effect nodes and skipped nodes are resolved instantly.
 */

export interface DialogueHost {
  evaluate(condition: Condition): boolean;
  /** Receives every effect, in order. Must be synchronous. */
  apply(effect: DialogueEffect): void;
}

export interface ChoiceView {
  option: ChoiceOption;
  /** Visible but not selectable (`showWhenLocked` + failed condition). */
  locked: boolean;
}

export type DialogueState =
  | { status: 'line'; nodeId: DialogueNodeId; pageIndex: number }
  | { status: 'choice'; nodeId: DialogueNodeId; options: readonly ChoiceView[] }
  | { status: 'finished' };

export type DialogueErrorCode =
  | 'missingNode'
  | 'loop'
  | 'noSelectableOptions'
  | 'invalidState'
  | 'unknownOption'
  | 'lockedOption'
  | 'emptyLine';

export class DialogueError extends Error {
  override name = 'DialogueError';
  constructor(
    readonly code: DialogueErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** Max invisible steps (branches, effects, skips) in a row before we call it a loop. */
export const MAX_INVISIBLE_STEPS = 100;

const FINISHED: DialogueState = { status: 'finished' };

export function startDialogue(script: DialogueScript, host: DialogueHost): DialogueState {
  return resolve(script, script.start, host);
}

/** Next page of the current line, or the node after it. */
export function advanceDialogue(
  script: DialogueScript,
  state: DialogueState,
  host: DialogueHost,
): DialogueState {
  if (state.status !== 'line') {
    throw new DialogueError('invalidState', `Cannot advance from "${state.status}"`);
  }
  const node = getNode(script, state.nodeId);
  if (node.type !== 'line') throw new DialogueError('invalidState', `${node.id} is not a line`);
  if (state.pageIndex + 1 < node.pages.length) {
    return { ...state, pageIndex: state.pageIndex + 1 };
  }
  return resolve(script, node.next, host);
}

export function chooseOption(
  script: DialogueScript,
  state: DialogueState,
  optionId: string,
  host: DialogueHost,
): DialogueState {
  if (state.status !== 'choice') {
    throw new DialogueError('invalidState', `Cannot choose from "${state.status}"`);
  }
  const view = state.options.find((v) => v.option.id === optionId);
  if (!view) throw new DialogueError('unknownOption', `Option "${optionId}" is not available`);
  if (view.locked) throw new DialogueError('lockedOption', `Option "${optionId}" is locked`);

  const node = getNode(script, state.nodeId) as ChoiceNode;
  if (node.recordAs) {
    host.apply({ kind: 'recordChoice', choice: node.recordAs, option: optionId });
  }
  for (const effect of view.option.effects ?? []) host.apply(effect);
  return resolve(script, view.option.next, host);
}

/** Escape on a menu. Returns null when the choice has no `cancelOptionId`. */
export function cancelChoice(
  script: DialogueScript,
  state: DialogueState,
  host: DialogueHost,
): DialogueState | null {
  if (state.status !== 'choice') return null;
  const node = getNode(script, state.nodeId) as ChoiceNode;
  if (!node.cancelOptionId) return null;
  const view = state.options.find((v) => v.option.id === node.cancelOptionId);
  if (!view || view.locked) return null;
  return chooseOption(script, state, node.cancelOptionId, host);
}

/** The node behind a visible state (for rendering). */
export function getNode(script: DialogueScript, id: DialogueNodeId): DialogueNode {
  const node = script.nodes[id];
  if (!node) throw new DialogueError('missingNode', `Node "${id}" does not exist in ${script.id}`);
  return node;
}

function resolve(
  script: DialogueScript,
  startId: DialogueNodeId | undefined,
  host: DialogueHost,
): DialogueState {
  let id = startId;
  for (let steps = 0; steps < MAX_INVISIBLE_STEPS; steps++) {
    if (id === undefined) return FINISHED;
    const node = getNode(script, id);

    if (node.condition && !host.evaluate(node.condition)) {
      id = node.skipTo ?? defaultNext(node);
      continue;
    }

    for (const effect of node.effects ?? []) host.apply(effect);

    switch (node.type) {
      case 'line':
        if (node.pages.length === 0) {
          throw new DialogueError('emptyLine', `Line "${node.id}" has no pages`);
        }
        return { status: 'line', nodeId: node.id, pageIndex: 0 };
      case 'effect':
        id = node.next;
        continue;
      case 'branch':
        id = node.branches.find((b) => host.evaluate(b.when))?.next ?? node.fallback;
        continue;
      case 'choice': {
        const options = visibleOptions(node, host);
        if (!options.some((v) => !v.locked)) {
          throw new DialogueError('noSelectableOptions', `Choice "${node.id}" has nothing to pick`);
        }
        return { status: 'choice', nodeId: node.id, options };
      }
    }
  }
  throw new DialogueError(
    'loop',
    `More than ${MAX_INVISIBLE_STEPS} invisible steps in ${script.id} (loop without a line or choice?)`,
  );
}

function defaultNext(node: DialogueNode): DialogueNodeId | undefined {
  switch (node.type) {
    case 'line':
    case 'effect':
      return node.next;
    case 'branch':
      return node.fallback;
    case 'choice':
      return undefined;
  }
}

function visibleOptions(node: ChoiceNode, host: DialogueHost): ChoiceView[] {
  const views: ChoiceView[] = [];
  for (const option of node.options) {
    const allowed = !option.condition || host.evaluate(option.condition);
    if (allowed) views.push({ option, locked: false });
    else if (option.showWhenLocked) views.push({ option, locked: true });
  }
  return views;
}
