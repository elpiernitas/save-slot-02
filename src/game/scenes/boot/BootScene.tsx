import { useEffect, useRef } from 'react';
import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import { useReducedMotion } from '../../ui/useReducedMotion';
import { useRevealLines } from '../../ui/useRevealLines';
import type { SceneProps } from '../types';
import '../terminal.css';
import './BootScene.css';

/** Short and mysterious. Must not reveal who made this or why. */
const LOG = [
  'INICIANDO...',
  'CARGANDO DATOS DEL JUGADOR...',
  'COMPROBANDO ESTADO DE LA MISIÓN...',
  'NO SE HA PODIDO IDENTIFICAR 1 ENTRADA.',
  'INTENTANDO LEERLA DE TODOS MODOS...',
] as const;

const STEP_MS = 420;
const HOLD_AFTER_MS = 650;

export function BootScene(_: SceneProps) {
  const { services, dispatch } = useGame();
  const reduced = useReducedMotion();
  const { shown, done, revealAll } = useRevealLines(LOG.length, STEP_MS, reduced);
  const leaving = useRef(false);

  const next = () => {
    if (leaving.current) return;
    leaving.current = true;
    dispatch({ type: 'scene/goTo', scene: 'saveDetected' });
  };

  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    services.audio.playSfx('boot');
  }, [services.audio]);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(next, HOLD_AFTER_MS);
    return () => window.clearTimeout(id);
  });

  const advance = () => (done ? next() : revealAll());
  useInput((input, { repeat }) => input === 'confirm' && !repeat && advance());

  const progress = Math.round((shown / LOG.length) * 100);

  return (
    <div className="scene terminal boot" onClick={advance}>
      <div className="terminal__log">
        {LOG.slice(0, shown).map((line, i) => (
          <p key={line} className={`terminal__line${i === 3 ? ' tone-select' : ''}`}>
            {'> '}
            {line}
          </p>
        ))}
        {!done && <span className="blink">_</span>}
      </div>
      <div className="boot__bar" role="progressbar" aria-valuenow={progress} aria-label="Cargando">
        <div className="boot__bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
