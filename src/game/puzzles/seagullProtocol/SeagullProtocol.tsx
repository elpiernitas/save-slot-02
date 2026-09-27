import { useEffect, useReducer } from 'react';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import { BeaconIcon } from '../routeBeacons/BeaconIcon';
import {
  dive,
  initialSeagull,
  moveSeagull,
  previewDone,
  SEAGULL_GRID,
  seagullComplete,
  seagullProgress,
  type SeagullDirection,
} from './seagullProtocol';
import './seagullProtocol.css';

const PREVIEW_MS = 900;

interface SeagullProtocolProps {
  onComplete: (attempts: number) => void;
  onLeave: () => void;
}

/** The short optional-feeling detour is mandatory only until it is resolved. */
export function SeagullProtocol({ onComplete, onLeave }: SeagullProtocolProps) {
  const { services } = useGame();
  const [state, send] = useReducer(
    (current: ReturnType<typeof initialSeagull>, action: 'preview' | SeagullDirection | 'dive') => {
      if (action === 'preview') return previewDone(current);
      if (action === 'dive') return dive(current);
      return moveSeagull(current, action);
    },
    undefined,
    initialSeagull,
  );

  const complete = seagullComplete(state);
  useEffect(() => {
    if (state.phase !== 'preview' || complete) return;
    const id = window.setTimeout(() => send('preview'), PREVIEW_MS);
    return () => window.clearTimeout(id);
  }, [state.phase, state.dive, complete]);

  useInput(
    (input, { repeat }) => {
      if (state.phase === 'success') {
        if (!repeat && (input === 'confirm' || input === 'cancel')) {
          services.audio.playSfx('confirm');
          onComplete(Math.max(1, state.misses + 1));
        }
        return;
      }
      if (state.phase === 'preview') return;
      if (input === 'up' || input === 'down' || input === 'left' || input === 'right') {
        send(input);
      } else if (input === 'confirm' && !repeat) {
        const before = state;
        const next = dive(before);
        services.audio.playSfx(next.misses > before.misses ? 'puzzleWrong' : 'interact');
        send('dive');
      } else if (input === 'cancel' && !repeat) {
        services.audio.playSfx('cancel');
        onLeave();
      }
    },
    { priority: INPUT_PRIORITY.panel },
  );

  const targetVisible = state.phase === 'preview';
  return (
    <div className="inv-layer seagull-protocol-layer" role="presentation">
      <section
        className="rpg-box seagull-protocol"
        role="dialog"
        aria-label="Protocolo de la gaviota"
      >
        <header className="seagull-protocol__head">
          <span>MG-01 · PROTOCOLO DE LA GAVIOTA</span>
          <span>{seagullProgress(state)}</span>
        </header>
        <p className="seagull-protocol__copy">
          {complete
            ? state.assisted
              ? 'LA GAVIOTA PIERDE EL INTERÉS. RUTA RESUELTA.'
              : 'SEÑAL RECUPERADA. LA GAVIOTA SIGUE JUZGÁNDOTE.'
            : targetVisible
              ? 'LA SOMBRA MARCA EL SIGUIENTE PUNTO.'
              : 'MUEVE A LUIS A LA LOSA MARCADA Y CONFIRMA.'}
        </p>
        <div
          className="seagull-protocol__grid"
          role="grid"
          aria-label="Losas del protocolo"
          style={{ gridTemplateColumns: `repeat(${SEAGULL_GRID.columns}, 1fr)` }}
        >
          {Array.from({ length: SEAGULL_GRID.columns * SEAGULL_GRID.rows }, (_, cell) => (
            <span
              key={cell}
              className="seagull-protocol__cell"
              data-cursor={cell === state.cursor || undefined}
              data-target={targetVisible && cell === state.target ? '' : undefined}
              role="gridcell"
              aria-label={`Loseta ${cell + 1}${targetVisible && cell === state.target ? ', objetivo' : ''}`}
            >
              {targetVisible && cell === state.target && (
                <BeaconIcon symbol="bird" label="objetivo" />
              )}
              {cell === state.cursor && !complete && (
                <span className="seagull-protocol__player">P1</span>
              )}
            </span>
          ))}
        </div>
        <div className="seagull-protocol__footer">
          <span>{state.misses ? `FALLOS ${state.misses}` : 'SIN FALLOS'}</span>
          {complete ? (
            <span>
              <kbd>ENTER</kbd> CONTINUAR
            </span>
          ) : (
            <span>
              <kbd>↑↓←→</kbd> MOVER <kbd>ENTER</kbd> PICADO <kbd>ESC</kbd> SALIR
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
