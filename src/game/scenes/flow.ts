import { storyScene } from '../boss/story';
import type { GameSave } from '../state/types';
import { DEV_SCENES, FIRST_GAMEPLAY_SCENE, isSceneId, type SceneId } from './sceneIds';

/**
 * Pure routing rules, testable without React:
 *   first visit:  systemCheck → boot → saveDetected → title
 *   later visits: systemCheck → title
 *   CONTINUE:     title → classSelect (until a class is confirmed) → next scene
 */
export function sceneAfterSystemCheck(save: GameSave): SceneId {
  return save.system.bootCompletedAt ? 'title' : 'boot';
}

/**
 * Where the game goes once a class is confirmed. GAME-04 builds the real
 * explorable world here; until then `overworld` is a diegetic loading screen.
 */
export const SCENE_AFTER_CLASS_SELECT: SceneId = 'overworld';

/** classSelect is only for players without a class; others move on. */
export function resolveClassSelect(save: GameSave): SceneId {
  return save.player.classId === null ? 'classSelect' : SCENE_AFTER_CLASS_SELECT;
}

/** Where the title screen's CONTINUE leads. */
export function continueTarget(save: GameSave): SceneId {
  // Story progress proven by the save wins over the last scene visited.
  const story = storyScene(save);
  if (story) return story;
  const resume = save.progress.resumeSceneId ?? FIRST_GAMEPLAY_SCENE;
  return resume === 'classSelect' ? resolveClassSelect(save) : resume;
}

/**
 * Development only: `?devScene=dialogueDemo` jumps to a dev scene after the
 * system check. Callers pass `import.meta.env.DEV`, so production builds
 * never honour it and no link to it exists in the UI.
 */
export function devSceneFromQuery(search: string, isDev: boolean): SceneId | null {
  if (!isDev) return null;
  const requested = new URLSearchParams(search).get('devScene');
  return isSceneId(requested) && DEV_SCENES.includes(requested) ? requested : null;
}
