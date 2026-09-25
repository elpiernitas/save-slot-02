import { useState } from 'react';
import { useFullscreen } from '../../../hooks/useFullscreen';
import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import { LeaderLine } from '../../ui/LeaderLine';
import { Menu } from '../../ui/Menu';
import { useMenu, type MenuItem } from '../../ui/useMenu';
import { useReducedMotion } from '../../ui/useReducedMotion';
import { useRevealLines } from '../../ui/useRevealLines';
import { sceneAfterSystemCheck } from '../flow';
import type { SceneProps } from '../types';
import '../terminal.css';
import './SystemCheckScene.css';

const CHECKS = [
  { label: 'DISPLAY', value: 'OK' },
  { label: 'INPUT', value: 'KEYBOARD' },
  { label: 'AUDIO', value: 'STANDBY' },
  { label: 'SAVE DATA', value: 'FOUND' },
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
    dispatch({ type: 'scene/goTo', scene: sceneAfterSystemCheck(save) });
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
      ? [{ id: 'continue', label: '[ CONTINUE ]' }]
      : [
          {
            id: 'fullscreen',
            label: prompt === 'denied' ? '[ RETRY FULLSCREEN ]' : '[ ENTER FULLSCREEN ]',
          },
          { id: 'window', label: '[ CONTINUE IN WINDOW ]' },
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
      <p className="terminal__heading">SYSTEM CHECK...</p>
      <div className="terminal__log">
        {CHECKS.slice(0, shown).map((check) => (
          <LeaderLine key={check.label} label={check.label} value={check.value} tone="system" />
        ))}
      </div>

      {done && (
        <div className="system-check__prompt">
          {!fullscreen.supported ? (
            <p className="terminal__line tone-dim">
              FULLSCREEN NOT AVAILABLE IN THIS BROWSER. THE QUEST CONTINUES IN WINDOW.
            </p>
          ) : fullscreen.active ? (
            <p className="terminal__line tone-system">FULLSCREEN MODE ACTIVE.</p>
          ) : prompt === 'denied' ? (
            <p className="terminal__line tone-danger">
              FULLSCREEN REQUEST DENIED. YOU CAN RETRY OR CONTINUE IN WINDOW.
            </p>
          ) : (
            <p className="terminal__line">
              FULLSCREEN MODE RECOMMENDED<span className="blink">_</span>
            </p>
          )}
          <Menu
            label="Start options"
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
          <kbd>ENTER</kbd>SELECT
        </span>
        <span>
          <kbd>ESC</kbd>LEAVE FULLSCREEN ANYTIME
        </span>
      </div>
    </div>
  );
}
