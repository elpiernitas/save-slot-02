import type { SfxId } from '../audio/types';
import { evaluateCondition } from '../state/conditions';
import type { GameCommand } from '../state/GameContext';
import { gameReducer } from '../state/gameReducer';
import type { GameSave } from '../state/types';
import type { DialogueHost } from './runtime';
import type { DialogueActionId, DialogueEffect } from './types';

/**
 * Bridge between dialogue effects (data) and the game (reducer, audio,
 * registered actions). Every effect maps to exactly one explicit outcome;
 * nothing is silently dropped.
 */
export type EffectOutcome =
  | { kind: 'command'; command: GameCommand }
  | { kind: 'sfx'; sfx: SfxId }
  | { kind: 'action'; action: DialogueActionId; payload: unknown }
  | { kind: 'unsupported'; effect: DialogueEffect; reason: string };

/** Effects whose game systems belong to later phases. */
export const UNSUPPORTED_EFFECTS: Readonly<Partial<Record<DialogueEffect['kind'], string>>> = {
  setQuest: 'quest log arrives in a later phase',
};

export function interpretEffect(effect: DialogueEffect): EffectOutcome {
  switch (effect.kind) {
    case 'setFlag':
      return {
        kind: 'command',
        command: { type: 'flag/set', flag: effect.flag, value: effect.value },
      };
    case 'recordChoice':
      return {
        kind: 'command',
        command: { type: 'choice/record', choice: effect.choice, option: effect.option },
      };
    case 'unlockAchievement':
      return {
        kind: 'command',
        command: { type: 'achievement/unlock', achievement: effect.achievement },
      };
    case 'goToScene':
      return { kind: 'command', command: { type: 'scene/goTo', scene: effect.scene } };
    case 'playSfx':
      return { kind: 'sfx', sfx: effect.sfx };
    case 'action':
      return { kind: 'action', action: effect.action, payload: effect.payload };
    case 'giveItem':
      return {
        kind: 'command',
        command: {
          type: 'item/give',
          item: effect.item,
          ...(effect.quantity !== undefined && { quantity: effect.quantity }),
        },
      };
    case 'takeItem':
      return {
        kind: 'command',
        command: {
          type: 'item/take',
          item: effect.item,
          ...(effect.quantity !== undefined && { quantity: effect.quantity }),
        },
      };
    case 'giveCard':
      return { kind: 'command', command: { type: 'card/give', card: effect.card } };
    case 'setQuest':
      return {
        kind: 'unsupported',
        effect,
        reason: `"${effect.kind}" is not supported yet (${UNSUPPORTED_EFFECTS[effect.kind]})`,
      };
  }
}

/** Handlers for `{ kind: 'action' }` effects, looked up by id. Never stored in scripts. */
export type DialogueActionHandler = (payload: unknown) => void;
export type DialogueActionRegistry = Readonly<Record<DialogueActionId, DialogueActionHandler>>;

/**
 * A host that evaluates conditions against a *simulated* save: game commands
 * produced by effects are applied locally with the real reducer, so a branch
 * right after `setFlag` sees the new flag. Effects are recorded, not
 * executed, which keeps this pure (safe to run anywhere, even in a state
 * initializer). The caller then executes `effects` with `executeEffects`.
 */
export function createRecordingHost(save: GameSave, now: Date) {
  let snapshot = save;
  const effects: DialogueEffect[] = [];
  const at = now.toISOString();
  const host: DialogueHost = {
    evaluate: (condition) => evaluateCondition(condition, { save: snapshot, now }),
    apply: (effect) => {
      effects.push(effect);
      const outcome = interpretEffect(effect);
      if (outcome.kind === 'command' && outcome.command.type !== 'save/replace') {
        snapshot = gameReducer(snapshot, { ...outcome.command, at });
      }
    },
  };
  return { host, effects, snapshot: () => snapshot };
}

export interface EffectExecutor {
  dispatch(command: GameCommand): void;
  playSfx(sfx: SfxId): void;
  actions: DialogueActionRegistry;
  /** Called for unsupported effects and unknown action ids. */
  onUnsupported(outcome: Extract<EffectOutcome, { kind: 'unsupported' }>): void;
}

export function executeEffects(effects: readonly DialogueEffect[], executor: EffectExecutor): void {
  for (const effect of effects) {
    const outcome = interpretEffect(effect);
    switch (outcome.kind) {
      case 'command':
        executor.dispatch(outcome.command);
        break;
      case 'sfx':
        executor.playSfx(outcome.sfx);
        break;
      case 'action': {
        const handler = Object.hasOwn(executor.actions, outcome.action)
          ? executor.actions[outcome.action]
          : undefined;
        if (handler) handler(outcome.payload);
        else {
          executor.onUnsupported({
            kind: 'unsupported',
            effect,
            reason: `No handler registered for action "${outcome.action}"`,
          });
        }
        break;
      }
      case 'unsupported':
        executor.onUnsupported(outcome);
        break;
    }
  }
}
