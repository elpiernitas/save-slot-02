import { parseMarkup, plainText } from './markup';
import { cardDefinition } from '../content/cards';
import { itemDefinition } from '../content/items';
import { UNSUPPORTED_EFFECTS } from './effects';
import type { DialogueEffect, DialogueNodeId, DialogueScript, Speaker } from './types';

/**
 * Static checks for dialogue scripts. Run in unit tests for every content
 * script so broken links, bad markup or oversized pages never reach the game.
 *
 * Page size limits are conservative *estimates*: real width depends on the
 * words and the font. The box fits 3 lines of ~50–60 characters (with a
 * portrait). The UI additionally warns in development if a page overflows.
 */
export const PAGE_SOFT_LIMIT = 110; // warning: probably tight
export const PAGE_HARD_LIMIT = 150; // error: will not fit
export const PAGE_MAX_LINES = 3;
export const CHOICE_LABEL_LIMIT = 30;

export interface DialogueIssue {
  severity: 'error' | 'warning';
  nodeId: DialogueNodeId | null;
  message: string;
}

export interface ValidateOptions {
  /** Global cast merged with `script.speakers`. */
  cast?: readonly Speaker[];
  /** Known action ids (from the registry the scene will use). */
  actionIds?: readonly string[];
  /** Known portrait ids. */
  portraitIds?: readonly string[];
}

export function validateDialogueScript(
  script: DialogueScript,
  { cast = [], actionIds, portraitIds }: ValidateOptions = {},
): DialogueIssue[] {
  const issues: DialogueIssue[] = [];
  const error = (nodeId: string | null, message: string) =>
    issues.push({ severity: 'error', nodeId, message });
  const warn = (nodeId: string | null, message: string) =>
    issues.push({ severity: 'warning', nodeId, message });

  const speakers = new Map([...cast, ...(script.speakers ?? [])].map((s) => [s.id, s]));
  const exists = (id: string | undefined) => id === undefined || Object.hasOwn(script.nodes, id);
  const link = (from: string, to: string | undefined, what: string) => {
    if (!exists(to)) error(from, `${what} points to missing node "${to}"`);
  };

  if (!Object.hasOwn(script.nodes, script.start))
    error(null, `start node "${script.start}" missing`);

  const checkText = (nodeId: string, text: string, label: string) => {
    const { errors } = parseMarkup(text);
    for (const e of errors) error(nodeId, `${label}: ${e}`);
    const visible = plainText(text);
    const lines = visible.split('\n').length;
    if (visible.length > PAGE_HARD_LIMIT) {
      error(nodeId, `${label} is ${visible.length} chars (max ${PAGE_HARD_LIMIT}); split it`);
    } else if (visible.length > PAGE_SOFT_LIMIT) {
      warn(nodeId, `${label} is ${visible.length} chars; may not fit (soft ${PAGE_SOFT_LIMIT})`);
    }
    if (lines > PAGE_MAX_LINES)
      error(nodeId, `${label} has ${lines} lines (max ${PAGE_MAX_LINES})`);
  };

  const checkEffects = (nodeId: string, effects: readonly DialogueEffect[] | undefined) => {
    for (const effect of effects ?? []) {
      const unsupported = UNSUPPORTED_EFFECTS[effect.kind];
      if (unsupported) warn(nodeId, `effect "${effect.kind}" unsupported: ${unsupported}`);
      if (effect.kind === 'action' && actionIds && !actionIds.includes(effect.action)) {
        error(nodeId, `action "${effect.action}" has no registered handler`);
      }
      if (
        (effect.kind === 'giveItem' || effect.kind === 'takeItem') &&
        !itemDefinition(effect.item)
      ) {
        error(nodeId, `${effect.kind}: unknown item "${effect.item}"`);
      }
      if (effect.kind === 'giveCard' && !cardDefinition(effect.card)) {
        error(nodeId, `giveCard: unknown card "${effect.card}"`);
      }
      if (effect.kind === 'goToScene') {
        warn(nodeId, 'goToScene inside a dialogue unmounts it; prefer onFinish unless intended');
      }
    }
  };

  const checkSpeaker = (nodeId: string, speaker: string | undefined, portrait?: string | null) => {
    if (speaker !== undefined && !speakers.has(speaker))
      error(nodeId, `unknown speaker "${speaker}"`);
    const resolved =
      portrait === undefined ? speakers.get(speaker ?? '')?.defaultPortrait : portrait;
    if (resolved && portraitIds && !portraitIds.includes(resolved)) {
      error(nodeId, `unknown portrait "${resolved}"`);
    }
  };

  for (const [key, node] of Object.entries(script.nodes)) {
    if (node.id !== key) error(key, `node key "${key}" does not match id "${node.id}"`);
    link(key, node.skipTo, 'skipTo');
    checkEffects(key, node.effects);

    switch (node.type) {
      case 'line':
        if (node.pages.length === 0) error(key, 'line has no pages');
        node.pages.forEach((page, i) => checkText(key, page, `page ${i + 1}`));
        checkSpeaker(key, node.speaker, node.portrait);
        link(key, node.next, 'next');
        break;
      case 'effect':
        link(key, node.next, 'next');
        break;
      case 'branch':
        node.branches.forEach((b, i) => link(key, b.next, `branch ${i + 1}`));
        link(key, node.fallback, 'fallback');
        break;
      case 'choice': {
        if (node.options.length === 0) error(key, 'choice has no options');
        if (node.prompt) checkText(key, node.prompt, 'prompt');
        checkSpeaker(key, node.speaker, node.portrait);
        const ids = new Set<string>();
        for (const option of node.options) {
          if (ids.has(option.id)) error(key, `duplicate option id "${option.id}"`);
          ids.add(option.id);
          link(key, option.next, `option "${option.id}"`);
          checkEffects(key, option.effects);
          if (option.label.length > CHOICE_LABEL_LIMIT) {
            warn(key, `option "${option.id}" label is long (${option.label.length} chars)`);
          }
        }
        if (node.cancelOptionId && !ids.has(node.cancelOptionId)) {
          error(key, `cancelOptionId "${node.cancelOptionId}" is not an option`);
        }
        break;
      }
    }
  }

  for (const id of unreachable(script)) warn(id, 'node is unreachable from start');
  return issues;
}

function unreachable(script: DialogueScript): string[] {
  const seen = new Set<string>();
  const queue = [script.start];
  while (queue.length) {
    const id = queue.pop()!;
    if (seen.has(id) || !Object.hasOwn(script.nodes, id)) continue;
    seen.add(id);
    const node = script.nodes[id]!;
    const targets: (string | undefined)[] = [node.skipTo];
    if (node.type === 'line' || node.type === 'effect') targets.push(node.next);
    if (node.type === 'branch') targets.push(...node.branches.map((b) => b.next), node.fallback);
    if (node.type === 'choice') targets.push(...node.options.map((o) => o.next));
    for (const t of targets) if (t) queue.push(t);
  }
  return Object.keys(script.nodes).filter((id) => !seen.has(id));
}
