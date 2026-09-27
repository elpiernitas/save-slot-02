import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import { PLAYER_DISPLAY_NAME } from '../../content/player';
import { PLAYER_CLASSES } from '../../player/classes';
import { LeaderLine } from '../../ui/LeaderLine';
import { useReducedMotion } from '../../ui/useReducedMotion';
import { useRevealLines } from '../../ui/useRevealLines';
import type { SceneProps } from '../types';
import './SaveDetectedScene.css';

export function SaveDetectedScene(_: SceneProps) {
  const { save, services, dispatch } = useGame();
  const reduced = useReducedMotion();
  const rows = [
    { label: 'JUGADOR', value: save.player.name ?? PLAYER_DISPLAY_NAME, tone: 'select' as const },
    { label: 'ESTADO', value: 'INCOMPLETO', tone: 'danger' as const },
    {
      label: 'CLASE',
      value: save.player.classId ? PLAYER_CLASSES[save.player.classId].displayName : 'SIN ASIGNAR',
      tone: 'dim' as const,
    },
  ];
  // Rows + the final message line.
  const { shown, done, revealAll } = useRevealLines(rows.length + 1, 380, reduced);

  const advance = () => {
    if (!done) return revealAll();
    services.audio.playSfx('confirm');
    dispatch({ type: 'system/bootCompleted' });
    dispatch({ type: 'scene/goTo', scene: 'title' });
  };
  useInput((input, { repeat }) => input === 'confirm' && !repeat && advance());

  return (
    <div className="scene save-detected" onClick={advance}>
      <section className="rpg-box save-detected__box" aria-live="polite">
        <h1 className="save-detected__title">PARTIDA GUARDADA ENCONTRADA</h1>
        <div className="save-detected__rows">
          {rows.slice(0, shown).map((row) => (
            <LeaderLine key={row.label} label={row.label} value={row.value} tone={row.tone} />
          ))}
        </div>
        {shown > rows.length && (
          <p className="save-detected__message">
            Se ha detectado una misión secundaria sin identificar.
          </p>
        )}
        <span className="save-detected__more">{done && <span className="more-indicator" />}</span>
      </section>
    </div>
  );
}
