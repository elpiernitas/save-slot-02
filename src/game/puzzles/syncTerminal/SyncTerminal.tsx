import { useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import {
  canLeave,
  initialTerminal,
  openings,
  poweredTiles,
  terminalReducer,
  type Side,
  type Tile,
} from './syncTerminal';
import './syncTerminal.css';

/** Pause (ms) before each automatic step of the post-sync sequence. */
const STEP_MS = { p1Synced: 1100, p2Check: 1900, recovering: 1500 } as const;
const CELL = 40;
const HALF = CELL / 2;
const END: Record<Side, [number, number]> = {
  n: [HALF, 0],
  e: [CELL, HALF],
  s: [HALF, CELL],
  w: [0, HALF],
};

function TileGlyph({ tile, powered }: { tile: Tile; powered: boolean }) {
  const [a, b] = openings(tile);
  const [ax, ay] = END[a!];
  const [bx, by] = END[b!];
  return (
    <svg viewBox={`0 0 ${CELL} ${CELL}`} className="sync-tile__svg" aria-hidden="true">
      <path
        d={`M${ax} ${ay} L${HALF} ${HALF} L${bx} ${by}`}
        className="sync-tile__pipe"
        data-powered={powered || undefined}
      />
      <rect x={HALF - 3} y={HALF - 3} width={6} height={6} className="sync-tile__hub" />
    </svg>
  );
}

interface SyncTerminalProps {
  /** Fallback applied: the scene records completion and closes. */
  onComplete: () => void;
  /** Left before the final lock (no progress kept). */
  onLeave: () => void;
}

/**
 * PZ-02 SYNC TERMINAL (GAME_06_SPEC §11). Two channels: PLAYER 1 is a small
 * pipe puzzle; PLAYER 2 is never playable. Reveals only "NOT FOUND".
 */
export function SyncTerminal({ onComplete, onLeave }: SyncTerminalProps) {
  const { services } = useGame();
  const [state, send] = useReducer(terminalReducer, undefined, initialTerminal);
  const powered = poweredTiles(state.tiles);
  // Latest callback, called exactly once when the fallback completes.
  const completeRef = useRef(onComplete);
  const firedRef = useRef(false);
  useLayoutEffect(() => {
    completeRef.current = onComplete;
  });

  // Automatic steps of the post-sync sequence.
  useEffect(() => {
    if (state.phase === 'done') {
      if (!firedRef.current) {
        firedRef.current = true;
        completeRef.current();
      }
      return;
    }
    const delay = STEP_MS[state.phase as keyof typeof STEP_MS];
    if (delay === undefined) return;
    if (state.phase === 'p2Check') services.audio.playSfx('cancel');
    const id = window.setTimeout(() => send({ type: 'advance' }), delay);
    return () => window.clearTimeout(id);
  }, [state.phase, services.audio]);

  const rotate = (tile?: number) => {
    services.audio.playSfx('cursor');
    send({ type: 'rotate', ...(tile !== undefined && { tile }) });
  };
  const applyFallback = () => {
    if (state.phase !== 'fallback') return;
    services.audio.playSfx('confirm');
    send({ type: 'advance' });
  };

  useInput(
    (input, { repeat }) => {
      if (state.phase === 'fallback') {
        if (input === 'confirm' && !repeat) applyFallback();
        return;
      }
      if (state.phase !== 'solving') return;
      if (input === 'up') send({ type: 'move', dir: 'n' });
      else if (input === 'down') send({ type: 'move', dir: 's' });
      else if (input === 'left') send({ type: 'move', dir: 'w' });
      else if (input === 'right') send({ type: 'move', dir: 'e' });
      else if (input === 'confirm' && !repeat) rotate();
      else if (input === 'cancel' && !repeat && canLeave(state)) {
        services.audio.playSfx('cancel');
        onLeave();
      }
    },
    { priority: INPUT_PRIORITY.panel },
  );

  const synced = state.phase !== 'solving';
  const p2Failed = ['p2Check', 'fallback', 'recovering', 'done'].includes(state.phase);

  return (
    <div className="inv-layer">
      <section
        className="rpg-box sync-terminal"
        role="dialog"
        aria-label="Terminal de sincronización"
        data-glitch={p2Failed || undefined}
      >
        <p className="sync-terminal__title">ACCESO DE SERVICIO · TERMINAL DE SINCRONIZACIÓN</p>
        <div className="sync-terminal__channels">
          <div className="sync-channel">
            <p className="sync-channel__label">
              ENTRADA PLAYER 1{' '}
              <span data-ok={synced || undefined}>
                {synced ? '[ SINCRONIZADA ]' : '[ ACTIVA ]'}
              </span>
            </p>
            <div className="sync-grid" role="grid" aria-label="Canal de PLAYER 1">
              <span className="sync-grid__source" aria-hidden="true">
                ▶
              </span>
              {state.tiles.map((tile, index) => (
                <button
                  key={index}
                  type="button"
                  tabIndex={-1}
                  className="sync-tile"
                  style={{ gridColumn: tile.col + 2, gridRow: tile.row + 1 }}
                  data-selected={(!synced && index === state.cursor) || undefined}
                  aria-label={`Pieza ${index + 1}${powered.includes(index) ? ', con corriente' : ''}`}
                  disabled={synced}
                  onMouseMove={() =>
                    index !== state.cursor && send({ type: 'select', tile: index })
                  }
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => rotate(index)}
                >
                  <TileGlyph tile={tile} powered={powered.includes(index)} />
                </button>
              ))}
              <span className="sync-grid__output" aria-hidden="true">
                ▼
              </span>
            </div>
          </div>
          <div className="sync-channel" data-offline aria-disabled="true">
            <p className="sync-channel__label">
              ENTRADA PLAYER 2{' '}
              <span data-bad>{p2Failed ? '[ NO ENCONTRADA ]' : '[ SIN SEÑAL ]'}</span>
            </p>
            <div className="sync-grid" aria-hidden="true">
              {[
                [2, 1],
                [3, 1],
                [3, 2],
              ].map(([col, row]) => (
                <span
                  key={`${col}${row}`}
                  className="sync-tile"
                  style={{ gridColumn: col, gridRow: row }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="sync-terminal__log" aria-live="polite">
          {state.phase === 'solving' && <p>LLEVA LA SEÑAL DE ▶ A ▼.</p>}
          {state.phase === 'p1Synced' && <p>PLAYER 1 — SINCRONIZADO</p>}
          {p2Failed && <p>PLAYER 1 — SINCRONIZADO</p>}
          {p2Failed && <p data-bad>ENTRADA PLAYER 2........ NO ENCONTRADA</p>}
          {['fallback', 'recovering', 'done'].includes(state.phase) && (
            <p className="sync-terminal__narrator">
              Eso parece... menos opcional de lo que debería.
            </p>
          )}
          {state.phase === 'fallback' && (
            <button
              type="button"
              tabIndex={-1}
              className="sync-terminal__fallback"
              onMouseDown={(event) => event.preventDefault()}
              onClick={applyFallback}
            >
              RUTA ALTERNATIVA DISPONIBLE — <kbd>ENTER</kbd> APLICAR
            </button>
          )}
          {['recovering', 'done'].includes(state.phase) && (
            <>
              <p>RECUPERANDO ENTRADA PERDIDA...</p>
              <p data-bad>ERROR EN EL PROCESO DE RECUPERACIÓN</p>
            </>
          )}
        </div>
        <p className="inv-hint">
          {state.phase === 'solving' ? (
            <>
              <kbd>↑↓←→</kbd> ELEGIR <kbd>ENTER</kbd> GIRAR <kbd>ESC</kbd> SALIR
            </>
          ) : (
            <>ENTRADA BLOQUEADA</>
          )}
        </p>
      </section>
    </div>
  );
}
