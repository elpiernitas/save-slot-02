import { describe, expect, it } from 'vitest';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import { continueTarget, sceneAfterSystemCheck } from './flow';

const T = '2026-09-28T09:00:00.000Z';
const fresh = () => createInitialSave(new Date(T));

describe('start-up flow', () => {
  it('first visit plays the boot intro', () => {
    expect(sceneAfterSystemCheck(fresh())).toBe('boot');
  });

  it('later visits skip straight to the title', () => {
    const save = gameReducer(fresh(), { type: 'system/bootCompleted', at: T });
    expect(sceneAfterSystemCheck(save)).toBe('title');
  });

  it('CONTINUE starts the game proper, then resumes where the player left', () => {
    expect(continueTarget(fresh())).toBe('classSelect');
    const save = gameReducer(fresh(), { type: 'scene/goTo', scene: 'overworld', at: T });
    expect(continueTarget(save)).toBe('overworld');
  });
});
