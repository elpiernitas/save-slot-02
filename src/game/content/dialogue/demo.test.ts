import { describe, expect, it } from 'vitest';
import {
  advanceDialogue,
  chooseOption,
  startDialogue,
  type DialogueState,
} from '../../dialogue/runtime';
import { createRecordingHost } from '../../dialogue/effects';
import { validateDialogueScript } from '../../dialogue/validate';
import { createInitialSave } from '../../state/newGame';
import type { GameSave } from '../../state/types';
import { CAST } from '../cast';
import { PORTRAITS } from '../portraits';
import { DEMO_ACHIEVEMENT, DEMO_CHOICE, DEMO_DIALOGUE, DEMO_FLAG_MET } from './demo';

const now = new Date('2026-09-28T10:00:00Z');

/** Plays the demo to the end, picking `option`, and returns the resulting save. */
function playThrough(save: GameSave, option: string) {
  const rec = createRecordingHost(save, now);
  const visited: string[] = [];
  let state: DialogueState = startDialogue(DEMO_DIALOGUE, rec.host);
  for (let guard = 0; state.status !== 'finished' && guard < 100; guard++) {
    visited.push(state.nodeId);
    state =
      state.status === 'choice'
        ? chooseOption(DEMO_DIALOGUE, state, option, rec.host)
        : advanceDialogue(DEMO_DIALOGUE, state, rec.host);
  }
  return { save: rec.snapshot(), visited, finished: state.status === 'finished' };
}

describe('demo dialogue content', () => {
  it('is valid: no errors, no warnings', () => {
    expect(
      validateDialogueScript(DEMO_DIALOGUE, { cast: CAST, portraitIds: Object.keys(PORTRAITS) }),
    ).toEqual([]);
  });

  it('first visit: sets the flag, stores the choice and unlocks the achievement', () => {
    const run = playThrough(createInitialSave(now), 'shortcuts');
    expect(run.finished).toBe(true);
    expect(run.visited[0]).toBe('intro');
    expect(run.save.flags[DEMO_FLAG_MET]).toBe(true);
    expect(run.save.choices[DEMO_CHOICE]).toBe('shortcuts');
    expect(run.save.achievements[DEMO_ACHIEVEMENT]).toBeDefined();
  });

  it('returning player: the stored choice changes the dialogue', () => {
    const first = playThrough(createInitialSave(now), 'charisma');
    const second = playThrough(first.save, 'silence');
    expect(second.visited.slice(0, 2)).toEqual(['again', 'againCharisma']);
    expect(second.save.choices[DEMO_CHOICE]).toBe('silence');
  });
});
