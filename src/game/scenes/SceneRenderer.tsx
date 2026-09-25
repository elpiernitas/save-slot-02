import { useEffect, useState } from 'react';
import { InputBlocker } from '../input/useInput';
import { useGame } from '../state/useGame';
import { useReducedMotion } from '../ui/useReducedMotion';
import { PlaceholderScene } from './PlaceholderScene';
import { getSceneDefinition } from './registry';
import type { SceneId } from './sceneIds';
import '../ui/ui.css';
import './SceneTransition.css';

/** Stepped cut-to-black: short enough to feel like a hardware screen swap. */
export const TRANSITION_COVER_MS = 110;
export const TRANSITION_REVEAL_MS = 150;

type Phase = 'idle' | 'cover' | 'reveal';

/**
 * Renders exactly one scene: the one stored in the save. Changing scenes is
 * a state change (`dispatch({ type: 'scene/goTo', … })`), never a new `if`
 * branch. Between scenes: stepped fade to black, input blocked; instant with
 * reduced motion.
 */
export function SceneRenderer() {
  const { save } = useGame();
  const reduced = useReducedMotion();
  const target = save.progress.sceneId;
  const [shown, setShown] = useState<SceneId>(target);
  const [phase, setPhase] = useState<Phase>('idle');

  // Adjust state during render when the target changes (no effect needed).
  if (target !== shown && phase === 'idle') {
    if (reduced) setShown(target);
    else setPhase('cover');
  }

  useEffect(() => {
    if (phase === 'cover') {
      const id = window.setTimeout(() => {
        setShown(target);
        setPhase('reveal');
      }, TRANSITION_COVER_MS);
      return () => window.clearTimeout(id);
    }
    if (phase === 'reveal') {
      const id = window.setTimeout(() => setPhase('idle'), TRANSITION_REVEAL_MS);
      return () => window.clearTimeout(id);
    }
  }, [phase, target]);

  const Scene = getSceneDefinition(shown)?.component ?? PlaceholderScene;

  return (
    <div className="game-root" data-reduced-motion={reduced} data-scene={shown}>
      <Scene key={shown} sceneId={shown} />
      {phase !== 'idle' && (
        <>
          <div className="scene-transition" data-phase={phase} aria-hidden="true" />
          <InputBlocker />
        </>
      )}
    </div>
  );
}
