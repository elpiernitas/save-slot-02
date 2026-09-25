import type { SceneProps } from './types';

/** Shown for scene ids that exist in the type system but are not built yet. */
export function PlaceholderScene({ sceneId }: SceneProps) {
  return (
    <div className="scene scene--placeholder">
      <p className="shell-text">SCENE “{sceneId}” NOT BUILT YET</p>
    </div>
  );
}
