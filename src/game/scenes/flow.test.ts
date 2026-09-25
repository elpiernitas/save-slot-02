import { describe, expect, it } from 'vitest';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import {
  continueTarget,
  devSceneFromQuery,
  resolveClassSelect,
  SCENE_AFTER_CLASS_SELECT,
  sceneAfterSystemCheck,
} from './flow';

const T = '2026-09-28T09:00:00.000Z';
const fresh = () => createInitialSave(new Date(T));
const withClass = () =>
  gameReducer(fresh(), { type: 'player/assignClass', classId: 'tank', at: T });

describe('start-up flow', () => {
  it('first visit plays the boot intro', () => {
    expect(sceneAfterSystemCheck(fresh())).toBe('boot');
  });

  it('later visits skip straight to the title', () => {
    const save = gameReducer(fresh(), { type: 'system/bootCompleted', at: T });
    expect(sceneAfterSystemCheck(save)).toBe('title');
  });
});

describe('CONTINUE flow (GAME-03)', () => {
  it('TITLE → classSelect for a new player (the GAME-02 demo override is gone)', () => {
    expect(continueTarget(fresh())).toBe('classSelect');
  });

  it('never asks for a class twice: classSelect resolves to the next scene', () => {
    expect(resolveClassSelect(fresh())).toBe('classSelect');
    expect(resolveClassSelect(withClass())).toBe(SCENE_AFTER_CLASS_SELECT);
    expect(continueTarget(withClass())).toBe(SCENE_AFTER_CLASS_SELECT);
  });

  it('resumes classSelect if the player left before confirming', () => {
    const save = gameReducer(fresh(), { type: 'scene/goTo', scene: 'classSelect', at: T });
    expect(continueTarget(save)).toBe('classSelect');
  });

  it('resumes wherever the player was after the class', () => {
    const save = gameReducer(withClass(), { type: 'scene/goTo', scene: 'overworld', at: T });
    expect(continueTarget(save)).toBe('overworld');
  });
});

describe('dialogue demo is out of the player flow', () => {
  it('is never the CONTINUE target and never stored as resume point', () => {
    const save = gameReducer(fresh(), { type: 'scene/goTo', scene: 'dialogueDemo', at: T });
    expect(save.progress.resumeSceneId).toBeNull();
    expect(continueTarget(save)).toBe('classSelect');
  });

  it('is reachable only through the dev query in development builds', () => {
    expect(devSceneFromQuery('?devScene=dialogueDemo', true)).toBe('dialogueDemo');
    expect(devSceneFromQuery('?devScene=dialogueDemo', false)).toBeNull();
    expect(devSceneFromQuery('?devScene=title', true)).toBeNull(); // not a dev scene
    expect(devSceneFromQuery('', true)).toBeNull();
  });
});
