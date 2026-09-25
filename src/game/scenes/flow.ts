import type { GameSave } from '../state/types';
import { FIRST_GAMEPLAY_SCENE, type SceneId } from './sceneIds';

/**
 * Start-up routing, kept pure so the rules are testable:
 *   first visit:  systemCheck → boot → saveDetected → title
 *   later visits: systemCheck → title
 */
export function sceneAfterSystemCheck(save: GameSave): SceneId {
  return save.system.bootCompletedAt ? 'title' : 'boot';
}

/** Where the title screen's CONTINUE leads. */
export function continueTarget(save: GameSave): SceneId {
  return save.progress.resumeSceneId ?? FIRST_GAMEPLAY_SCENE;
}
