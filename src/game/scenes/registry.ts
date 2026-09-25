import { BootScene } from './boot/BootScene';
import type { SceneId } from './sceneIds';
import type { SceneDefinition } from './types';

/**
 * Scene id → implementation. Each phase registers the scenes it builds;
 * ids without an entry render the "not built yet" placeholder, so the game
 * never crashes on a scene that only exists on paper.
 */
export const SCENE_REGISTRY: Partial<Record<SceneId, SceneDefinition>> = {
  boot: { id: 'boot', component: BootScene },
};

export function getSceneDefinition(id: SceneId): SceneDefinition | undefined {
  return SCENE_REGISTRY[id];
}
