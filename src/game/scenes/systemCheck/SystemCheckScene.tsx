import { useState } from 'react';
import { useFullscreen } from '../../../hooks/useFullscreen';
import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import { LeaderLine } from '../../ui/LeaderLine';
import { Menu } from '../../ui/Menu';
import { useMenu, type MenuItem } from '../../ui/useMenu';
import { useReducedMotion } from '../../ui/useReducedMotion';
import { useRevealLines } from '../../ui/useRevealLines';
import { devSceneFromQuery, sceneAfterSystemCheck } from '../flow';
import type { SceneProps } from '../types';
import '../terminal.css';
import './SystemCheckScene.css';

const CHECKS = [
  { label: 'PANTALLA', value: 'OK' },
  { label: 'ENTRADA', value: 'TECLADO' },
  { label: 'AUDIO', value: 'EN ESPERA' },
  { label: 'PARTIDA GUARDADA', value: 'ENCONTRADA' },
] as const;

type Prompt = 'offer' | 'denied';

/**
 * Every session starts here. The player's first gesture on this screen
 * unlocks audio and (optionally) requests fullscreen — browsers allow both
 * only from inside a click/keypress.
 */
export function SystemCheckScene(_: SceneProps) {
  const { save, services, dispatch } = useGame();
  const fullscreen = useFullscreen(services.fullscreen);
  const reduced = useReducedMotion();
  const returning = save.system.sessionCount > 1;
  const { shown, done, revealAll } = useRevealLines(CHECKS.length, returning ? 70 : 260, reduced);
  const [prompt, setPrompt] = useState<Prompt>('offer');

  const proceed = () => {
    void services.audio.unlock();
    const devScene = devSceneFromQuery(window.location.search, import.meta.env.DEV);
    dispatch({ type: 'scene/goTo', scene: devScene ?? sceneAfterSystemCheck(save) });
  };

  const enterFullscreen = () => {
    // Must be the first thing in the gesture handler: no await before this.
    const request = services.fullscreen.request();
    void services.audio.unlock();
    void request.then((result) => {
      if (result === 'denied') setPrompt('denied');
      else proceed();
    });
  };

  const items: MenuItem[] =
    !fullscreen.supported || fullscreen.active
      ? [{ id: 'continue', label: '[ CONTINUAR ]' }]
      : [
          {
            id: 'fullscreen',
            label:
              prompt === 'denied' ? '[ REINTENTAR PANTALLA COMPLETA ]' : '[ PANTALLA COMPLETA ]',
          },
          { id: 'window', label: '[ CONTINUAR EN VENTANA ]' },
        ];

  const menu = useMenu({
    items,
    enabled: done,
    onConfirm: (item) => (item.id === 'fullscreen' ? enterFullscreen() : proceed()),
  });

  // While the log is printing, any confirm reveals the rest.
  useInput((input) => input === 'confirm' && revealAll(), { enabled: !done });

  return (
    <div className="scene terminal system-check" onClick={done ? undefined : revealAll}>
      <p className="terminal__heading">COMPROBACIÓN DEL SISTEMA...</p>
      <div className="terminal__log">
        {CHECKS.slice(0, shown).map((check) => (
          <LeaderLine key={check.label} label={check.label} value={check.value} tone="system" />
        ))}
      </div>

      {done && (
        <div className="system-check__prompt">
          {!fullscreen.supported ? (
            <p className="terminal__line tone-dim">
              PANTALLA COMPLETA NO DISPONIBLE EN ESTE NAVEGADOR. LA MISIÓN SIGUE EN VENTANA.
            </p>
          ) : fullscreen.active ? (
            <p className="terminal__line tone-system">PANTALLA COMPLETA ACTIVA.</p>
          ) : prompt === 'denied' ? (
            <p className="terminal__line tone-danger">
              EL NAVEGADOR HA DENEGADO LA PANTALLA COMPLETA. PUEDES REINTENTAR O SEGUIR EN VENTANA.
            </p>
          ) : (
            <p className="terminal__line">
              SE RECOMIENDA PANTALLA COMPLETA<span className="blink">_</span>
            </p>
          )}
          <Menu
            label="Opciones de inicio"
            items={items}
            selected={menu.selected}
            onHover={menu.select}
            onConfirm={menu.confirm}
            className="system-check__menu"
          />
        </div>
      )}

      <div className="terminal__footer key-hints">
        <span>
          <kbd>ENTER</kbd>ELEGIR
        </span>
        <span>
          <kbd>ESC</kbd>SALIR DE PANTALLA COMPLETA
        </span>
      </div>
    </div>
  );
}
