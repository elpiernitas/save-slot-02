import { useInput } from '../input/useInput';
import { useGame } from '../state/useGame';
import type { SceneProps } from './types';
import './terminal.css';

/**
 * Diegetic stand-in for scenes that exist in the type system but are not
 * built yet. Any confirm/cancel returns to the title.
 */
export function PlaceholderScene({ sceneId }: SceneProps) {
  const { dispatch } = useGame();
  const back = () => dispatch({ type: 'scene/goTo', scene: 'title' });
  useInput((input, { repeat }) => {
    if (!repeat && (input === 'confirm' || input === 'cancel')) back();
  });

  return (
    <div className="scene terminal" onClick={back}>
      <p className="terminal__heading">ZONA AÚN NO GENERADA</p>
      <p className="terminal__line tone-dim">REGIÓN: {sceneId.toUpperCase()}</p>
      <p className="terminal__line">ESTA PARTE DEL MUNDO TODAVÍA SE ESTÁ CARGANDO.</p>
      <div className="terminal__footer key-hints">
        <span>
          <kbd>ESC</kbd>VOLVER AL TÍTULO
        </span>
      </div>
    </div>
  );
}
