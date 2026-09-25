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

/**
 * TEMPORARY (GAME-02): while no gameplay scene exists, CONTINUE opens the
 * dialogue demo instead of the "not generated" placeholder. Set to `null`
 * when GAME-03 builds the class selection.
 */
export const CONTINUE_OVERRIDE: SceneId | null = 'dialogueDemo';

/** Where the title screen's CONTINUE leads. */
export function continueTarget(save: GameSave): SceneId {
  return save.progress.resumeSceneId ?? CONTINUE_OVERRIDE ?? FIRST_GAMEPLAY_SCENE;
}
