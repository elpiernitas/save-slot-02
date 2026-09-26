import { describe, expect, it } from 'vitest';
import type { DialogueScript } from './types';
import { PAGE_HARD_LIMIT, validateDialogueScript } from './validate';

const ok: DialogueScript = {
  id: 'ok',
  start: 'a',
  speakers: [{ id: 'npc', displayName: 'NPC' }],
  nodes: {
    a: { id: 'a', type: 'line', speaker: 'npc', pages: ['Hola.'], next: 'c' },
    c: {
      id: 'c',
      type: 'choice',
      prompt: '¿Sí?',
      cancelOptionId: 'n',
      options: [
        { id: 'y', label: 'Sí', next: 'end' },
        { id: 'n', label: 'No', next: 'end' },
      ],
    },
    end: { id: 'end', type: 'line', pages: ['Fin.'] },
  },
};

describe('validateDialogueScript', () => {
  it('accepts a correct script', () => {
    expect(validateDialogueScript(ok)).toEqual([]);
  });

  it('finds broken links, unknown speakers and bad cancel ids', () => {
    const bad: DialogueScript = {
      ...ok,
      start: 'nope',
      nodes: {
        ...ok.nodes,
        a: { id: 'a', type: 'line', speaker: 'ghost', pages: ['x'], next: 'missing' },
        c: {
          ...(ok.nodes.c as Extract<DialogueScript['nodes'][string], { type: 'choice' }>),
          cancelOptionId: 'z',
        },
      },
    };
    const messages = validateDialogueScript(bad).map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'start node "nope" missing',
        'unknown speaker "ghost"',
        'next points to missing node "missing"',
        'cancelOptionId "z" is not an option',
      ]),
    );
  });

  it('flags markup errors and pages that cannot fit', () => {
    const script: DialogueScript = {
      id: 'long',
      start: 'a',
      nodes: {
        a: {
          id: 'a',
          type: 'line',
          pages: ['[em]sin cerrar', 'x'.repeat(PAGE_HARD_LIMIT + 1), 'a\nb\nc\nd'],
        },
      },
    };
    const errors = validateDialogueScript(script).filter((i) => i.severity === 'error');
    expect(errors.map((e) => e.message)).toEqual([
      'page 1: Unclosed tag [em]',
      `page 2 is ${PAGE_HARD_LIMIT + 1} chars (max ${PAGE_HARD_LIMIT}); split it`,
      'page 3 has 4 lines (max 3)',
    ]);
  });

  it('warns about unsupported effects and unreachable nodes; errors on unknown actions', () => {
    const script: DialogueScript = {
      id: 'fx',
      start: 'a',
      nodes: {
        a: {
          id: 'a',
          type: 'effect',
          effects: [
            { kind: 'setQuest', quest: 'q', status: 'active' },
            { kind: 'giveCard', card: 'c1' },
            { kind: 'action', action: 'mystery' },
          ],
        },
        orphan: { id: 'orphan', type: 'line', pages: ['?'] },
      },
    };
    const issues = validateDialogueScript(script, { actionIds: ['known'] });
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          message: expect.stringMatching(/setQuest/),
        }),
        expect.objectContaining({ severity: 'error', message: 'giveCard: unknown card "c1"' }),
        expect.objectContaining({
          severity: 'error',
          message: 'action "mystery" has no registered handler',
        }),
        expect.objectContaining({ severity: 'warning', nodeId: 'orphan' }),
      ]),
    );
  });
});
