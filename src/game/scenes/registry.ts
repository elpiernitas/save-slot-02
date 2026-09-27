import { DesyncBoss } from '../boss/desync/DesyncBoss';
import { Player2Reveal } from '../boss/reveal/Player2Reveal';
import { DateGateScene } from '../dateGate/DateGateScene';
import { EndingScene } from '../ending/EndingScene';
import { SaveSlotScene } from '../ending/SaveSlotScene';
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
  /** GAME-07: DESYNC PROCESS, then the PLAYER 2 reveal + cooperative gate. */
  boss: { id: 'boss', component: DesyncBoss },
  player2Reveal: { id: 'player2Reveal', component: Player2Reveal },
  /** GAME-08: choose the real-world date route. */
  dateGate: { id: 'dateGate', component: DateGateScene },
  /** GAME-09: ending beat, then the persistent completed save. */
  ending: { id: 'ending', component: EndingScene },
  saveSlot: { id: 'saveSlot', component: SaveSlotScene },
};

export function getSceneDefinition(id: SceneId): SceneDefinition | undefined {
  return SCENE_REGISTRY[id];
}
