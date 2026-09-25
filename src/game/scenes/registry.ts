import { BootScene } from './boot/BootScene';
import { ClassSelectScene } from './classSelect/ClassSelectScene';
import { DialogueDemoScene } from './dialogueDemo/DialogueDemoScene';
import { SaveDetectedScene } from './saveDetected/SaveDetectedScene';
import { OverworldScene } from './overworld/OverworldScene';
import type { SceneId } from './sceneIds';
import { SystemCheckScene } from './systemCheck/SystemCheckScene';
import { TitleScene } from './title/TitleScene';
import type { SceneDefinition } from './types';

/**
 * Scene id → implementation. Each phase registers the scenes it builds;
 * ids without an entry render the "not generated yet" placeholder, so the
 * game never crashes on a scene that only exists on paper.
 */
export const SCENE_REGISTRY: Partial<Record<SceneId, SceneDefinition>> = {
  systemCheck: { id: 'systemCheck', component: SystemCheckScene },
  boot: { id: 'boot', component: BootScene },
  saveDetected: { id: 'saveDetected', component: SaveDetectedScene },
  title: { id: 'title', component: TitleScene },
  classSelect: { id: 'classSelect', component: ClassSelectScene },
  /** Exploration (GAME-04 vertical slice: La Muralla, afternoon). */
  overworld: { id: 'overworld', component: OverworldScene },
  dialogueDemo: { id: 'dialogueDemo', component: DialogueDemoScene },
};

export function getSceneDefinition(id: SceneId): SceneDefinition | undefined {
  return SCENE_REGISTRY[id];
}
