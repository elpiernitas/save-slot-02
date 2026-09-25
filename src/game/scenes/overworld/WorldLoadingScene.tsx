import { useEffect, useState } from 'react';
import { SIGILS } from '../../content/sigils';
import { useInput } from '../../input/useInput';
import { getPlayerClass } from '../../player/classes';
import { useGame } from '../../state/useGame';
import { PixelSprite } from '../../ui/PixelSprite';
import type { SceneProps } from '../types';
import './WorldLoadingScene.css';

/** In-world "the world is still loading" lines. Flavour only, no real places. */
const STATUS_LINES = [
  'Colocando farolas...',
  'Calculando la marea...',
  'Enfriando provisiones...',
  'Buscando aparcamiento...',
  'Convenciendo a las gaviotas...',
] as const;

/**
 * Provisional `overworld` (until GAME-04): a diegetic loading screen that
 * confirms the class is saved without showing development messages.
 * Escape returns to the title.
 */
export function WorldLoadingScene(_: SceneProps) {
  const { save, services, dispatch } = useGame();
  const [line, setLine] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setLine((n) => (n + 1) % STATUS_LINES.length), 1800);
    return () => window.clearInterval(id);
  }, []);

  useInput((input, { repeat }) => {
    if (input === 'cancel' && !repeat) {
      services.audio.playSfx('cancel');
      dispatch({ type: 'scene/goTo', scene: 'title' });
    }
  });

  const def = save.player.classId ? getPlayerClass(save.player.classId) : null;
  const sigil = def ? SIGILS[def.sigil] : undefined;

  return (
    <div className="scene world-loading" data-accent={def?.accent}>
      {def && (
        <div className="world-loading__player">
          {sigil && (
            <PixelSprite
              className="world-loading__sigil"
              rows={sigil.rows}
              palette={sigil.palette}
            />
          )}
          <span>PLAYER 1 · {def.displayName}</span>
        </div>
      )}
      <div className="world-loading__center">
        <p className="world-loading__title">LOADING WORLD...</p>
        <div className="world-loading__bar" aria-hidden="true">
          <div className="world-loading__fill" />
        </div>
        <p className="world-loading__status" aria-live="polite">
          {STATUS_LINES[line]}
        </p>
      </div>
      <footer className="world-loading__hints key-hints">
        <span>
          <kbd>ESC</kbd>TITLE
        </span>
      </footer>
    </div>
  );
}
