import { useEffect, useState } from 'react';
import { CLASS_ASSIGNED, CLASS_SELECT_INTRO } from '../../content/dialogue/classSelect';
import { PLAYER_SILHOUETTE, SIGILS } from '../../content/sigils';
import { DialoguePlayer } from '../../dialogue/ui/DialoguePlayer';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useInput } from '../../input/useInput';
import { PLAYER_CLASS_LIST, type PlayerClassDefinition } from '../../player/classes';
import { useGame } from '../../state/useGame';
import { Menu } from '../../ui/Menu';
import { PixelSprite } from '../../ui/PixelSprite';
import { useMenu } from '../../ui/useMenu';
import { resolveClassSelect, SCENE_AFTER_CLASS_SELECT } from '../flow';
import type { SceneProps } from '../types';
import { classSelectStep, INITIAL_CLASS_SELECT, type ClassSelectEvent } from './classSelectMachine';
import './ClassSelectScene.css';

/**
 * Character-creation screen: pick GUERRERO, TANQUE or CURADOR.
 * Logic lives in `classSelectMachine`; this component only renders it and
 * turns its commands into game actions. Nothing is saved before SÍ.
 */
export function ClassSelectScene(_: SceneProps) {
  const { save, services, dispatch } = useGame();
  // Decided once at mount: a player who already has a class never re-picks.
  const [alreadyAssigned] = useState(() => save.player.classId !== null);
  const [state, setState] = useState(INITIAL_CLASS_SELECT);

  useEffect(() => {
    if (alreadyAssigned) dispatch({ type: 'scene/goTo', scene: resolveClassSelect(save) });
  }, [alreadyAssigned, dispatch, save]);

  const send = (event: ClassSelectEvent) => {
    const { state: next, command } = classSelectStep(state, event);
    setState(next);
    if (command?.kind === 'assign') {
      dispatch({ type: 'player/assignClass', classId: command.classId });
    } else if (command?.kind === 'exitToTitle') {
      dispatch({ type: 'scene/goTo', scene: 'title' });
    }
  };

  useInput(
    (input, { repeat }) => {
      if (input === 'left' || input === 'right') {
        services.audio.playSfx('cursor');
        send({ type: 'move', dir: input === 'left' ? -1 : 1 });
      } else if (input === 'confirm' && !repeat) {
        services.audio.playSfx('confirm');
        send({ type: 'requestConfirm' });
      } else if (input === 'cancel' && !repeat) {
        services.audio.playSfx('cancel');
        send({ type: 'escape' });
      }
    },
    { enabled: state.phase === 'browse' },
  );

  if (alreadyAssigned) return <div className="scene class-select" />;

  const selected = PLAYER_CLASS_LIST[state.index]!;
  const showCards = state.phase !== 'intro';

  return (
    <div className="scene class-select" data-phase={state.phase}>
      <p className="class-select__label">PLAYER 1 // ELECCIÓN DE CLASE</p>

      {showCards && (
        <>
          <h1 className="class-select__heading">ELIGE TU CLASE.</h1>
          <ul className="class-select__cards" role="listbox" aria-label="Clases">
            {PLAYER_CLASS_LIST.map((def, index) => (
              <ClassCard
                key={def.id}
                def={def}
                selected={index === state.index}
                dimmed={state.phase === 'assigned' && index !== state.index}
                onHover={() => {
                  if (state.phase !== 'browse' || index === state.index) return;
                  services.audio.playSfx('cursor');
                  send({ type: 'highlight', index });
                }}
                onClick={() => {
                  if (state.phase !== 'browse') return;
                  services.audio.playSfx('confirm');
                  const highlighted = classSelectStep(state, { type: 'highlight', index });
                  const opened = classSelectStep(highlighted.state, { type: 'requestConfirm' });
                  setState(opened.state);
                }}
              />
            ))}
          </ul>
          <ClassDetail def={selected} />
          {state.phase === 'browse' && (
            <footer className="class-select__hints key-hints">
              <span>
                <kbd>← →</kbd>
                <kbd>A D</kbd>CAMBIAR
              </span>
              <span>
                <kbd>ENTER</kbd>ELEGIR
              </span>
              <span>
                <kbd>ESC</kbd>TÍTULO
              </span>
            </footer>
          )}
        </>
      )}

      {state.phase === 'intro' && (
        <DialoguePlayer script={CLASS_SELECT_INTRO} onFinish={() => send({ type: 'introDone' })} />
      )}

      {state.phase === 'confirm' && (
        <ConfirmClass
          def={selected}
          onYes={() => send({ type: 'confirm' })}
          onBack={() => send({ type: 'cancelConfirm' })}
        />
      )}

      {state.phase === 'assigned' && (
        <DialoguePlayer
          script={CLASS_ASSIGNED}
          onFinish={() => dispatch({ type: 'scene/goTo', scene: SCENE_AFTER_CLASS_SELECT })}
        />
      )}
    </div>
  );
}

function Sigil({ id, className }: { id: string; className?: string }) {
  const art = SIGILS[id];
  return art ? <PixelSprite className={className} rows={art.rows} palette={art.palette} /> : null;
}

function ClassCard({
  def,
  selected,
  dimmed,
  onHover,
  onClick,
}: {
  def: PlayerClassDefinition;
  selected: boolean;
  dimmed: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  return (
    <li
      className="class-card"
      role="option"
      aria-selected={selected}
      data-accent={def.accent}
      data-selected={selected || undefined}
      data-dimmed={dimmed || undefined}
      onMouseMove={onHover}
      onClick={onClick}
    >
      <Sigil id={def.sigil} className="class-card__sigil" />
      <h2 className="class-card__name">{def.displayName}</h2>
      <p className="class-card__short">{def.shortDescription}</p>
      <p className="class-card__flavor">«{def.flavorLine}»</p>
    </li>
  );
}

/** Abstract preview: generic figure + the class sigil floating above it. */
function ClassDetail({ def }: { def: PlayerClassDefinition }) {
  return (
    <section className="class-detail rpg-box" data-accent={def.accent} aria-live="polite">
      <div className="class-detail__preview" aria-hidden="true">
        <Sigil id={def.sigil} className="class-detail__halo" />
        <PixelSprite
          className="class-detail__figure"
          rows={PLAYER_SILHOUETTE.rows}
          palette={PLAYER_SILHOUETTE.palette}
        />
        <span className="class-detail__ground" />
      </div>
      <div className="class-detail__text">
        <p className="class-detail__long">{def.longDescription}</p>
        <ul className="class-detail__traits">
          {def.traitLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ConfirmClass({
  def,
  onYes,
  onBack,
}: {
  def: PlayerClassDefinition;
  onYes: () => void;
  onBack: () => void;
}) {
  const items = [
    { id: 'yes', label: '[ SÍ ]' },
    { id: 'back', label: '[ VOLVER ]' },
  ];
  const menu = useMenu({
    items,
    priority: INPUT_PRIORITY.panel,
    onConfirm: (item) => (item.id === 'yes' ? onYes() : onBack()),
    onCancel: onBack,
  });
  return (
    <div className="class-confirm">
      <section className="rpg-box class-confirm__box" data-accent={def.accent} role="dialog">
        <p className="class-confirm__system">ASIGNAR CLASE:</p>
        <p className="class-confirm__name">{def.displayName}</p>
        <p className="class-confirm__question">¿CONFIRMAR?</p>
        <Menu
          label="Confirmar clase"
          items={items}
          selected={menu.selected}
          onHover={menu.select}
          onConfirm={menu.confirm}
        />
      </section>
    </div>
  );
}
