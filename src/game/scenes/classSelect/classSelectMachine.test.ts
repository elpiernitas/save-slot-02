import { describe, expect, it } from 'vitest';
import {
  classSelectStep,
  INITIAL_CLASS_SELECT,
  type ClassSelectEvent,
  type ClassSelectState,
} from './classSelectMachine';

function run(events: ClassSelectEvent[], from: ClassSelectState = INITIAL_CLASS_SELECT) {
  let state = from;
  const commands = [];
  for (const event of events) {
    const next = classSelectStep(state, event);
    state = next.state;
    if (next.command) commands.push(next.command);
  }
  return { state, commands };
}

describe('class select machine', () => {
  it('ignores input until the intro dialogue ends', () => {
    expect(run([{ type: 'move', dir: 1 }, { type: 'requestConfirm' }]).state).toEqual(
      INITIAL_CLASS_SELECT,
    );
  });

  it('browses the three classes, wrapping both ways', () => {
    const r = run([{ type: 'introDone' }, { type: 'move', dir: -1 }]);
    expect(r.state).toEqual({ phase: 'browse', index: 2 });
    expect(
      run([
        { type: 'introDone' },
        { type: 'move', dir: 1 },
        { type: 'move', dir: 1 },
        { type: 'move', dir: 1 },
      ]).state.index,
    ).toBe(0);
  });

  it('mouse hover highlights a valid card only', () => {
    expect(run([{ type: 'introDone' }, { type: 'highlight', index: 1 }]).state.index).toBe(1);
    expect(run([{ type: 'introDone' }, { type: 'highlight', index: 7 }]).state.index).toBe(0);
  });

  it('does not save anything until the confirmation is accepted', () => {
    const opened = run([
      { type: 'introDone' },
      { type: 'move', dir: 1 },
      { type: 'requestConfirm' },
    ]);
    expect(opened.state.phase).toBe('confirm');
    expect(opened.commands).toEqual([]);

    const done = run([{ type: 'confirm' }], opened.state);
    expect(done.state.phase).toBe('assigned');
    expect(done.commands).toEqual([{ kind: 'assign', classId: 'tank' }]);
  });

  it('VOLVER / Escape in the confirmation goes back to browsing, keeping the highlight', () => {
    const opened = run([
      { type: 'introDone' },
      { type: 'move', dir: -1 },
      { type: 'requestConfirm' },
    ]);
    expect(run([{ type: 'cancelConfirm' }], opened.state)).toEqual({
      state: { phase: 'browse', index: 2 },
      commands: [],
    });
    expect(run([{ type: 'escape' }], opened.state).state.phase).toBe('browse');
  });

  it('Escape while browsing returns to the title without assigning', () => {
    expect(run([{ type: 'introDone' }, { type: 'escape' }]).commands).toEqual([
      { kind: 'exitToTitle' },
    ]);
  });

  it('is inert once assigned (no double assignment)', () => {
    const assigned = { phase: 'assigned', index: 0 } as const;
    for (const event of [
      { type: 'confirm' },
      { type: 'escape' },
      { type: 'move', dir: 1 },
    ] as const) {
      expect(classSelectStep(assigned, event)).toEqual({ state: assigned, command: null });
    }
  });
});
