import { useEffect, useState } from 'react';
import { DialogueBox } from '../dialogue/ui/DialogueBox';
import '../dialogue/ui/dialogue.css';
import { INPUT_PRIORITY } from '../input/inputRouter';
import { useInput } from '../input/useInput';
import type { SceneProps } from '../scenes/types';
import { useGame } from '../state/useGame';
import { Menu } from '../ui/Menu';
import { useMenu, type MenuItem } from '../ui/useMenu';
import { Party } from '../ending/Party';
import '../boss/desync/desync.css';
import { DATE_GATE_COPY, dateGates, type GateView } from './routes';
import './dateGate.css';

type Stage = 'intro' | 'select' | 'confirm' | 'locked' | 'saving';

const LOCKED_MS = 1300;
const SAVING_MS = 1100;

const MANU_SPEAKER = {
  speakerId: 'manu',
  name: DATE_GATE_COPY.speaker,
  tone: 'default' as const,
  portrait: null,
  expression: undefined,
  voice: undefined,
};

const selectable = (g: GateView | undefined) => g?.kind === 'route' && g.status === 'available';

/**
 * Scene `dateGate` (GAME-08): four route gates in calendar order. Three are
 * the canonical date options; Friday is shown as the quest that already
 * exists (theatre), never selectable. Highlight and BACK never write the
 * save; only YES does (`date/choose`, first choice wins), then → `ending`.
 */
export function DateGateScene(_: SceneProps) {
  const { save, dispatch, services } = useGame();
  // Availability is fixed for the visit (Madrid calendar, injected clock).
  const [gates] = useState(() => dateGates(services.clock.now()));
  const anyOpen = gates.some(selectable);
  const [stage, setStage] = useState<Stage>('intro');
  const [index, setIndex] = useState(() => Math.max(0, gates.findIndex(selectable)));
  const gate = gates[index];

  // A save that already holds a route never chooses again.
  const chosen = save.dateQuest.chosenOptionId;
  useEffect(() => {
    if (chosen && stage !== 'locked' && stage !== 'saving') {
      dispatch({ type: 'scene/goTo', scene: 'ending' });
    }
  }, [chosen, stage, dispatch]);

  useEffect(() => {
    if (stage !== 'locked' && stage !== 'saving') return;
    const id = window.setTimeout(
      () =>
        stage === 'locked' ? setStage('saving') : dispatch({ type: 'scene/goTo', scene: 'ending' }),
      stage === 'locked' ? LOCKED_MS : SAVING_MS,
    );
    return () => window.clearTimeout(id);
  }, [stage, dispatch]);

  const move = (delta: -1 | 1) => {
    const next = Math.min(Math.max(index + delta, 0), gates.length - 1);
    if (next === index) return;
    services.audio.playSfx('cursor');
    setIndex(next);
  };

  const open = (i: number) => {
    if (selectable(gates[i])) {
      services.audio.playSfx('confirm');
      setIndex(i);
      setStage('confirm');
    } else {
      // Friday / elapsed: informative only, nothing to confirm.
      services.audio.playSfx('gateLocked');
    }
  };

  useInput(
    (input, { repeat }) => {
      if (stage === 'intro') {
        if (input === 'confirm' && !repeat) setStage('select');
        return;
      }
      if (stage !== 'select') return;
      if (!anyOpen) {
        // Nothing left to choose: Enter/Esc leave instead of a dead end.
        if ((input === 'confirm' || input === 'cancel') && !repeat) {
          dispatch({ type: 'scene/goTo', scene: 'title' });
        }
        return;
      }
      if (input === 'left') move(-1);
      else if (input === 'right') move(1);
      else if (input === 'confirm' && !repeat) open(index);
    },
    { priority: INPUT_PRIORITY.scene },
  );

  const lock = () => {
    if (gate?.kind !== 'route') return;
    dispatch({ type: 'date/choose', option: gate.id });
    services.audio.playSfx('save');
    setStage('locked');
  };

  return (
    <div className="reveal date-gate" aria-label={DATE_GATE_COPY.title}>
      <div className="date-gate__sky" aria-hidden="true" />
      <h1 className="date-gate__title">{DATE_GATE_COPY.title}</h1>

      {anyOpen ? (
        <ul className="date-gate__row" role="listbox" aria-label={DATE_GATE_COPY.title}>
          {gates.map((g, i) => (
            <li
              key={g.label}
              role="option"
              aria-selected={i === index}
              aria-disabled={!selectable(g)}
              className="date-gate__gate"
              data-kind={g.kind}
              data-status={g.kind === 'route' ? g.status : 'active'}
              data-selected={i === index && stage !== 'intro' ? '' : undefined}
              onMouseMove={() => stage === 'select' && i !== index && setIndex(i)}
              onClick={() => stage === 'select' && open(i)}
            >
              <span className="date-gate__label">{g.label}</span>
              <span
                className="date-gate__art"
                data-art={g.kind === 'route' ? g.id : 'friday'}
                aria-hidden="true"
              />
              {g.kind === 'route' ? (
                <span className="date-gate__sub">
                  {g.status === 'elapsed' ? DATE_GATE_COPY.elapsed : g.sub}
                </span>
              ) : (
                <>
                  <span className="date-gate__sub">{g.sub}</span>
                  <span className="date-gate__time">{g.time}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="date-gate__expired" role="status">
          <p>{DATE_GATE_COPY.expired}</p>
          <p className="date-gate__expired-line">{DATE_GATE_COPY.expiredLine}</p>
          <p className="date-gate__expired-hint">{DATE_GATE_COPY.expiredHint}</p>
        </div>
      )}

      <Party facing="up" />

      {stage === 'intro' && (
        <div className="dlg-layer">
          <DialogueBox speaker={MANU_SPEAKER} waiting onClick={() => setStage('select')}>
            {DATE_GATE_COPY.line}
          </DialogueBox>
        </div>
      )}

      {stage === 'confirm' && gate?.kind === 'route' && (
        <ConfirmPanel human={gate.human} onYes={lock} onBack={() => setStage('select')} />
      )}

      {(stage === 'locked' || stage === 'saving') && (
        <div className="desync__card date-gate__locked" role="status">
          <p className="desync__title">{DATE_GATE_COPY.locked}</p>
          {stage === 'saving' && <p>{DATE_GATE_COPY.saving}</p>}
        </div>
      )}
    </div>
  );
}

const CONFIRM_ITEMS: readonly MenuItem[] = [
  { id: 'yes', label: 'SÍ' },
  { id: 'back', label: 'VOLVER' },
];

function ConfirmPanel({
  human,
  onYes,
  onBack,
}: {
  human: string;
  onYes: () => void;
  onBack: () => void;
}) {
  const menu = useMenu({
    items: CONFIRM_ITEMS,
    priority: INPUT_PRIORITY.panel,
    onConfirm: (item) => (item.id === 'yes' ? onYes() : onBack()),
    onCancel: onBack,
  });
  return (
    <div className="desync__layer">
      <section className="rpg-box desync__panel" role="dialog" aria-label={DATE_GATE_COPY.confirm}>
        <h2 className="desync__panel-sub">{DATE_GATE_COPY.confirm}</h2>
        <p className="date-gate__human">{human}</p>
        <Menu
          label={DATE_GATE_COPY.confirm}
          items={CONFIRM_ITEMS}
          selected={menu.selected}
          onHover={menu.select}
          onConfirm={menu.confirm}
        />
      </section>
    </div>
  );
}
