import { useGame } from '../state/useGame';
import { PlaceholderScene } from './PlaceholderScene';
import { getSceneDefinition } from './registry';

/**
 * Renders exactly one scene: the one stored in the save. Changing scenes is
 * a state change (`dispatch({ type: 'scene/goTo', … })`), never a new `if`
 * branch in a component. Transitions will be layered here in GAME-01/GAME-11.
 */
export function SceneRenderer() {
  const { save } = useGame();
  const sceneId = save.progress.sceneId;
  const Scene = getSceneDefinition(sceneId)?.component ?? PlaceholderScene;
  return <Scene key={sceneId} sceneId={sceneId} />;
}
