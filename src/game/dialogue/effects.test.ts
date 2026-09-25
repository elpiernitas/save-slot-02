import { describe, expect, it, vi } from 'vitest';
import { createInitialSave } from '../state/newGame';
import { startDialogue } from './runtime';
import {
  createRecordingHost,
  executeEffects,
  interpretEffect,
  type EffectExecutor,
} from './effects';
import type { DialogueEffect, DialogueScript } from './types';

const now = new Date('2026-09-28T10:00:00Z');

function executor(actions: EffectExecutor['actions'] = {}) {
  return {
    dispatch: vi.fn(),
    playSfx: vi.fn(),
    actions,
    onUnsupported: vi.fn(),
  } satisfies EffectExecutor;
}

describe('interpretEffect', () => {
  it('maps supported effects to real game commands', () => {
    expect(interpretEffect({ kind: 'setFlag', flag: 'a', value: 1 })).toEqual({
      kind: 'command',
      command: { type: 'flag/set', flag: 'a', value: 1 },
    });
    expect(interpretEffect({ kind: 'unlockAchievement', achievement: 'x' })).toEqual({
      kind: 'command',
      command: { type: 'achievement/unlock', achievement: 'x' },
    });
    expect(interpretEffect({ kind: 'goToScene', scene: 'title' })).toEqual({
      kind: 'command',
      command: { type: 'scene/goTo', scene: 'title' },
    });
    expect(interpretEffect({ kind: 'recordChoice', choice: 'c', option: 'o' })).toEqual({
      kind: 'command',
      command: { type: 'choice/record', choice: 'c', option: 'o' },
    });
    expect(interpretEffect({ kind: 'playSfx', sfx: 'confirm' })).toEqual({
      kind: 'sfx',
      sfx: 'confirm',
    });
  });

  it.each<DialogueEffect>([
    { kind: 'giveItem', item: 'key' },
    { kind: 'takeItem', item: 'key' },
    { kind: 'giveCard', card: 'c1' },
    { kind: 'setQuest', quest: 'q', status: 'active' },
  ])('marks $kind as unsupported in this phase (never silently dropped)', (effect) => {
    const outcome = interpretEffect(effect);
    expect(outcome.kind).toBe('unsupported');
    expect(outcome.kind === 'unsupported' && outcome.reason).toMatch(/not supported yet/);
  });
});

describe('executeEffects', () => {
  it('dispatches commands, plays sfx and runs registered actions by id', () => {
    const shake = vi.fn();
    const ex = executor({ screenShake: shake });
    executeEffects(
      [
        { kind: 'setFlag', flag: 'f', value: true },
        { kind: 'playSfx', sfx: 'boot' },
        { kind: 'action', action: 'screenShake', payload: { strength: 2 } },
      ],
      ex,
    );
    expect(ex.dispatch).toHaveBeenCalledWith({ type: 'flag/set', flag: 'f', value: true });
    expect(ex.playSfx).toHaveBeenCalledWith('boot');
    expect(shake).toHaveBeenCalledWith({ strength: 2 });
    expect(ex.onUnsupported).not.toHaveBeenCalled();
  });

  it('reports unknown actions and unsupported effects', () => {
    const ex = executor();
    executeEffects(
      [
        { kind: 'action', action: 'toString' }, // prototype keys are not handlers
        { kind: 'giveCard', card: 'c1' },
      ],
      ex,
    );
    expect(ex.onUnsupported).toHaveBeenCalledTimes(2);
    expect(ex.dispatch).not.toHaveBeenCalled();
  });
});

describe('createRecordingHost', () => {
  it('lets later conditions see earlier effects without touching the real save', () => {
    const save = createInitialSave(now);
    const script: DialogueScript = {
      id: 's',
      start: 'set',
      nodes: {
        set: {
          id: 'set',
          type: 'effect',
          effects: [{ kind: 'setFlag', flag: 'met', value: true }],
          next: 'b',
        },
        b: {
          id: 'b',
          type: 'branch',
          branches: [{ when: { kind: 'flag', flag: 'met' }, next: 'yes' }],
          fallback: 'no',
        },
        yes: { id: 'yes', type: 'line', pages: ['sí'] },
        no: { id: 'no', type: 'line', pages: ['no'] },
      },
    };
    const rec = createRecordingHost(save, now);
    expect(startDialogue(script, rec.host)).toMatchObject({ nodeId: 'yes' });
    expect(rec.effects).toEqual([{ kind: 'setFlag', flag: 'met', value: true }]);
    expect(rec.snapshot().flags).toEqual({ met: true });
    expect(save.flags).toEqual({});
  });
});
