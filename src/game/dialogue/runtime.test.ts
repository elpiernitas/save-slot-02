import { describe, expect, it } from 'vitest';
import type { Condition } from '../state/conditions';
import {
  advanceDialogue,
  cancelChoice,
  chooseOption,
  DialogueError,
  startDialogue,
  type DialogueHost,
} from './runtime';
import type { DialogueEffect, DialogueScript } from './types';

/** Fake host: flags map + recorded effects. setFlag effects update the map. */
function host(flags: Record<string, boolean> = {}) {
  const applied: DialogueEffect[] = [];
  const h: DialogueHost & { applied: DialogueEffect[] } = {
    applied,
    evaluate: (c: Condition) => (c.kind === 'flag' ? Boolean(flags[c.flag]) : false),
    apply: (e) => {
      applied.push(e);
      if (e.kind === 'setFlag') flags[e.flag] = Boolean(e.value);
    },
  };
  return h;
}

const script: DialogueScript = {
  id: 'test',
  start: 'intro',
  nodes: {
    intro: { id: 'intro', type: 'line', pages: ['uno', 'dos'], next: 'gate' },
    gate: {
      id: 'gate',
      type: 'line',
      condition: { kind: 'flag', flag: 'vip' },
      pages: ['solo VIP'],
      next: 'fx',
    },
    fx: {
      id: 'fx',
      type: 'effect',
      effects: [{ kind: 'setFlag', flag: 'seen', value: true }],
      next: 'route',
    },
    route: {
      id: 'route',
      type: 'branch',
      branches: [{ when: { kind: 'flag', flag: 'seen' }, next: 'ask' }],
      fallback: 'never',
    },
    never: { id: 'never', type: 'line', pages: ['no'] },
    ask: {
      id: 'ask',
      type: 'choice',
      recordAs: 'answer',
      cancelOptionId: 'no',
      options: [
        { id: 'yes', label: 'Sí', next: 'bye', effects: [{ kind: 'playSfx', sfx: 'confirm' }] },
        { id: 'no', label: 'No', next: 'bye' },
        {
          id: 'secret',
          label: '???',
          next: 'bye',
          condition: { kind: 'flag', flag: 'key' },
          showWhenLocked: true,
        },
        { id: 'hidden', label: 'x', next: 'bye', condition: { kind: 'flag', flag: 'key' } },
      ],
    },
    bye: { id: 'bye', type: 'line', pages: ['adiós'] },
  },
};

describe('dialogue runtime', () => {
  it('starts on the first visible line', () => {
    expect(startDialogue(script, host())).toEqual({
      status: 'line',
      nodeId: 'intro',
      pageIndex: 0,
    });
  });

  it('pages through a line before moving on', () => {
    const h = host();
    let s = startDialogue(script, h);
    s = advanceDialogue(script, s, h);
    expect(s).toEqual({ status: 'line', nodeId: 'intro', pageIndex: 1 });
  });

  it('skips false conditions, runs effects and branches, then shows the choice', () => {
    const h = host();
    let s = startDialogue(script, h);
    s = advanceDialogue(script, advanceDialogue(script, s, h), h);
    expect(s.status).toBe('choice');
    expect(h.applied).toEqual([{ kind: 'setFlag', flag: 'seen', value: true }]);
  });

  it('shows a conditional line when the condition holds', () => {
    const h = host({ vip: true });
    const s = advanceDialogue(script, advanceDialogue(script, startDialogue(script, h), h), h);
    expect(s).toEqual({ status: 'line', nodeId: 'gate', pageIndex: 0 });
  });

  const toChoice = (h: ReturnType<typeof host>) => {
    const s = startDialogue(script, { ...h, evaluate: h.evaluate });
    return advanceDialogue(script, advanceDialogue(script, s, h), h);
  };

  it('hides failed options and shows showWhenLocked ones as locked', () => {
    const s = toChoice(host());
    expect(s.status === 'choice' && s.options.map((v) => [v.option.id, v.locked])).toEqual([
      ['yes', false],
      ['no', false],
      ['secret', true],
    ]);
  });

  it('records the choice, applies option effects and continues', () => {
    const h = host();
    const s = chooseOption(script, toChoice(h), 'yes', h);
    expect(s).toEqual({ status: 'line', nodeId: 'bye', pageIndex: 0 });
    expect(h.applied.slice(-2)).toEqual([
      { kind: 'recordChoice', choice: 'answer', option: 'yes' },
      { kind: 'playSfx', sfx: 'confirm' },
    ]);
  });

  it('refuses locked or unknown options', () => {
    const h = host();
    const s = toChoice(h);
    expect(() => chooseOption(script, s, 'secret', h)).toThrow(/locked/);
    expect(() => chooseOption(script, s, 'hidden', h)).toThrow(DialogueError);
  });

  it('Escape picks cancelOptionId', () => {
    const h = host();
    const s = cancelChoice(script, toChoice(h), h);
    expect(s).toEqual({ status: 'line', nodeId: 'bye', pageIndex: 0 });
    expect(h.applied).toContainEqual({ kind: 'recordChoice', choice: 'answer', option: 'no' });
  });

  it('finishes after the last node', () => {
    const h = host();
    const s = chooseOption(script, toChoice(h), 'no', h);
    expect(advanceDialogue(script, s, h)).toEqual({ status: 'finished' });
  });

  it('reports missing nodes', () => {
    const broken: DialogueScript = {
      id: 'b',
      start: 'a',
      nodes: { a: { id: 'a', type: 'effect', next: 'ghost' } },
    };
    expect(() => startDialogue(broken, host())).toThrow(
      expect.objectContaining({ code: 'missingNode' }),
    );
  });

  it('protects against loops of invisible nodes', () => {
    const loop: DialogueScript = {
      id: 'loop',
      start: 'a',
      nodes: {
        a: { id: 'a', type: 'effect', next: 'b' },
        b: { id: 'b', type: 'branch', branches: [], fallback: 'a' },
      },
    };
    expect(() => startDialogue(loop, host())).toThrow(expect.objectContaining({ code: 'loop' }));
  });

  it('fails loudly when a choice has nothing selectable', () => {
    const dead: DialogueScript = {
      id: 'dead',
      start: 'c',
      nodes: {
        c: {
          id: 'c',
          type: 'choice',
          options: [
            {
              id: 'x',
              label: 'x',
              next: 'c',
              condition: { kind: 'flag', flag: 'nope' },
              showWhenLocked: true,
            },
          ],
        },
      },
    };
    expect(() => startDialogue(dead, host())).toThrow(
      expect.objectContaining({ code: 'noSelectableOptions' }),
    );
  });

  it('uses skipTo when a node is skipped', () => {
    const s: DialogueScript = {
      id: 's',
      start: 'a',
      nodes: {
        a: {
          id: 'a',
          type: 'line',
          pages: ['x'],
          condition: { kind: 'flag', flag: 'no' },
          skipTo: 'c',
          next: 'b',
        },
        b: { id: 'b', type: 'line', pages: ['b'] },
        c: { id: 'c', type: 'line', pages: ['c'] },
      },
    };
    expect(startDialogue(s, host())).toEqual({ status: 'line', nodeId: 'c', pageIndex: 0 });
  });

  it('rejects actions that do not match the state', () => {
    const h = host();
    expect(() => advanceDialogue(script, { status: 'finished' }, h)).toThrow(/Cannot advance/);
    expect(() => chooseOption(script, { status: 'finished' }, 'yes', h)).toThrow(/Cannot choose/);
    expect(cancelChoice(script, { status: 'finished' }, h)).toBeNull();
  });
});
