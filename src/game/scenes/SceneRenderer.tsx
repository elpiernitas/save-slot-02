import { useEffect, useState } from 'react';
import { musicForScene } from '../audio/music';
import { InputBlocker } from '../input/useInput';
import { useGame } from '../state/useGame';
import { useReducedMotion } from '../ui/useReducedMotion';
import { PlaceholderScene } from './PlaceholderScene';
import { getSceneDefinition } from './registry';
import type { SceneId } from './sceneIds';
import { getTransitionView, TRANSITION_COVER_MS, TRANSITION_REVEAL_MS } from './sceneTransition';
import '../ui/ui.css';
import './SceneTransition.css';

/**
 * Renders exactly one scene: the one stored in the save. Changing scenes is
 * a state change (`dispatch({ type: 'scene/goTo', … })`), never a new `if`
 * branch. Between scenes: stepped fade to black with input blocked; instant
 * with reduced motion. State changes only happen in timer callbacks.
 */
export function SceneRenderer() {
  const { save, services } = useGame();
  const reduced = useReducedMotion();
  const target = save.progress.sceneId;
  const [shown, setShown] = useState<SceneId>(target);
  const [revealing, setRevealing] = useState(false);
  const { displayed, phase } = getTransitionView({ target, shown, revealing, reduced });

  // Swap the mounted scene once the screen is covered (immediately when reduced).
  useEffect(() => {
    if (target === shown) return;
    const id = window.setTimeout(
      () => {
        setShown(target);
        setRevealing(!reduced);
      },
      reduced ? 0 : TRANSITION_COVER_MS,
    );
    return () => window.clearTimeout(id);
  }, [target, shown, reduced]);

  useEffect(() => {
    if (!revealing) return;
    const id = window.setTimeout(() => setRevealing(false), TRANSITION_REVEAL_MS);
    return () => window.clearTimeout(id);
  }, [revealing]);

  // One place decides the music: the scene on screen (GAME_11_SPEC §8).
  const track = musicForScene(displayed);
  useEffect(() => {
    if (track) services.audio.playMusic(track, { fadeMs: 500 });
    else services.audio.stopMusic({ fadeMs: 300 });
  }, [track, services.audio]);

  const Scene = getSceneDefinition(displayed)?.component ?? PlaceholderScene;

  return (
    <div className="game-root" data-reduced-motion={reduced} data-scene={displayed}>
      <Scene key={displayed} sceneId={displayed} />
      {phase !== 'idle' && (
        <>
          <div className="scene-transition" data-phase={phase} aria-hidden="true" />
          <InputBlocker />
        </>
      )}
    </div>
  );
}
