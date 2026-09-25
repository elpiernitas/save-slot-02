/**
 * Every top-level screen of the game is a scene. Names are provisional and may
 * change as the story is written; add new ids here first.
 */
export const SCENE_IDS = [
  // Start-up sequence (GAME-01). Replayed/skipped each session, never resumed.
  'systemCheck',
  'boot',
  'saveDetected',
  'title',
  // Game proper (GAME-03+).
  'classSelect',
  'overworld',
  'dungeon',
  'boss',
  'player2Reveal',
  'dateGate',
  'ending',
  'saveSlot',
] as const;

export type SceneId = (typeof SCENE_IDS)[number];

/** Every session starts here (the first gesture unlocks audio + fullscreen). */
export const INITIAL_SCENE: SceneId = 'systemCheck';

/** Where CONTINUE goes when the player has never entered the game proper. */
export const FIRST_GAMEPLAY_SCENE: SceneId = 'classSelect';

export const STARTUP_SCENES: readonly SceneId[] = ['systemCheck', 'boot', 'saveDetected', 'title'];

export function isSceneId(value: unknown): value is SceneId {
  return typeof value === 'string' && (SCENE_IDS as readonly string[]).includes(value);
}

/** Gameplay scenes are remembered as the CONTINUE point; start-up scenes are not. */
export function isResumableScene(id: SceneId): boolean {
  return !STARTUP_SCENES.includes(id);
}
