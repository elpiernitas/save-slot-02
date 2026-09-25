/**
 * Every top-level screen of the game is a scene. Names are provisional and may
 * change as the story is written; add new ids here first.
 */
export const SCENE_IDS = [
  'boot',
  'title',
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

export const INITIAL_SCENE: SceneId = 'boot';

export function isSceneId(value: unknown): value is SceneId {
  return typeof value === 'string' && (SCENE_IDS as readonly string[]).includes(value);
}
