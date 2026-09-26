import { useState } from 'react';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import { binderEntries } from '../cards';
import { CardFace } from './CardFace';
import './inventory.css';

const COLUMNS = 4;

const obtained = (iso: string) =>
  new Date(iso)
    .toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();

/**
 * CITY CARDS binder (GAME_05_SPEC §13): owned cards only, no completion
 * counter. Arrows/WASD move, Enter opens the card (clears NEW), Esc goes back.
 */
export function CardBinder({ onBack }: { onBack: () => void }) {
  const { save, dispatch, services } = useGame();
  const entries = binderEntries(save);
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const current = entries[Math.min(selected, entries.length - 1)];

  const move = (delta: number) => {
    const next = Math.max(0, Math.min(entries.length - 1, selected + delta));
    if (next === selected) return;
    services.audio.playSfx('cursor');
    setSelected(next);
  };
  const openCard = (index: number) => {
    const entry = entries[index];
    if (!entry) return;
    services.audio.playSfx('confirm');
    setSelected(index);
    setOpen(true);
    if (!entry.owned.seen) dispatch({ type: 'card/markSeen', card: entry.card.id });
  };

  useInput(
    (input, { repeat }) => {
      if (open) {
        if (!repeat && (input === 'cancel' || input === 'confirm')) {
          services.audio.playSfx('cancel');
          setOpen(false);
        }
        return;
      }
      if (input === 'left') move(-1);
      else if (input === 'right') move(1);
      else if (input === 'up') move(-COLUMNS);
      else if (input === 'down') move(COLUMNS);
      else if (input === 'confirm' && !repeat) openCard(selected);
      else if (input === 'cancel' && !repeat) {
        services.audio.playSfx('cancel');
        onBack();
      }
    },
    { priority: INPUT_PRIORITY.panel },
  );

  return (
    <div className="inv-layer">
      <section className="rpg-box inv-panel inv-binder" role="dialog" aria-label="City Cards">
        <p className="inv-panel__title">CITY CARDS</p>
        {entries.length === 0 ? (
          <p className="inv-empty">AÚN NO HAY CARTAS. La ciudad observa. Con educación.</p>
        ) : (
          <div className="inv-panel__body">
            <ul className="inv-grid" aria-label="Cartas">
              {entries.map((entry, index) => (
                <li key={entry.card.id}>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="inv-slot"
                    data-selected={index === selected || undefined}
                    aria-current={index === selected || undefined}
                    onMouseMove={() => index !== selected && move(index - selected)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openCard(index)}
                  >
                    <CardFace card={entry.card} size="small" isNew={!entry.owned.seen} />
                  </button>
                </li>
              ))}
            </ul>
            {current && (
              <div className="inv-detail inv-detail--card">
                <CardFace card={current.card} />
                {open && (
                  <>
                    {current.card.description && (
                      <p className="inv-item__desc">{current.card.description}</p>
                    )}
                    <p className="inv-item__category">
                      OBTENIDA {obtained(current.owned.obtainedAt)}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <p className="inv-hint">
          <kbd>ENTER</kbd> {open ? 'CERRAR' : 'ABRIR'} <kbd>ESC</kbd> VOLVER
        </p>
      </section>
    </div>
  );
}
