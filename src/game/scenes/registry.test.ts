import { describe, expect, it } from 'vitest';
import { getSceneDefinition, SCENE_REGISTRY } from './registry';
import { INITIAL_SCENE, isSceneId, SCENE_IDS } from './sceneIds';

describe('scene registry', () => {
  it('has unique scene ids', () => {
    expect(new Set(SCENE_IDS).size).toBe(SCENE_IDS.length);
  });

  it('registers the initial scene', () => {
    expect(getSceneDefinition(INITIAL_SCENE)).toBeDefined();
  });

  it('keys every definition by its own id', () => {
    for (const [key, def] of Object.entries(SCENE_REGISTRY)) expect(def.id).toBe(key);
  });

  it('validates unknown ids', () => {
    expect(isSceneId('boot')).toBe(true);
    expect(isSceneId('pokemonCenter')).toBe(false);
    expect(isSceneId(42)).toBe(false);
  });
});
