import { describe, expect, it } from 'vitest';
import { getSceneDefinition, SCENE_REGISTRY } from './registry';
import {
  FIRST_GAMEPLAY_SCENE,
  INITIAL_SCENE,
  isResumableScene,
  isSceneId,
  SCENE_IDS,
  STARTUP_SCENES,
} from './sceneIds';

describe('scene registry', () => {
  it('has unique scene ids', () => {
    expect(new Set(SCENE_IDS).size).toBe(SCENE_IDS.length);
  });

  it('registers the whole start-up sequence', () => {
    expect(STARTUP_SCENES[0]).toBe(INITIAL_SCENE);
    for (const id of STARTUP_SCENES) expect(getSceneDefinition(id), id).toBeDefined();
  });

  it('keys every definition by its own id', () => {
    for (const [key, def] of Object.entries(SCENE_REGISTRY)) expect(def.id).toBe(key);
  });

  it('never resumes into a start-up scene', () => {
    for (const id of STARTUP_SCENES) expect(isResumableScene(id)).toBe(false);
    expect(isResumableScene(FIRST_GAMEPLAY_SCENE)).toBe(true);
  });

  it('validates unknown ids', () => {
    expect(isSceneId('title')).toBe(true);
    expect(isSceneId('pokemonCenter')).toBe(false);
    expect(isSceneId(42)).toBe(false);
  });
});
