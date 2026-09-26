import { useEffect, useState } from 'react';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import type { Acquisition } from '../cards';
import { CardFace } from './CardFace';
import './inventory.css';

interface AcquisitionOverlayProps {
  entries: readonly Acquisition[];
  onDone: () => void;
}

/**
 * Short reward notice after a dialogue (GAME_05_SPEC §11): one entry at a
 * time, confirm/cancel/click advances, no confetti. Owns input while open.
 */
export function AcquisitionOverlay({ entries, onDone }: AcquisitionOverlayProps) {
  const { services } = useGame();
  const [index, setIndex] = useState(0);
  const entry = entries[index];
  useEffect(() => {
    services.audio.playSfx('cardGet');
  }, [index, services.audio]);
  const next = () => {
    services.audio.playSfx('confirm');
    if (index + 1 < entries.length) setIndex(index + 1);
    else onDone();
  };
  useInput(
    (input, { repeat }) => {
      if (!repeat && (input === 'confirm' || input === 'cancel')) next();
    },
    { priority: INPUT_PRIORITY.panel },
  );
  if (!entry) return null;
  return (
    <div className="inv-layer" onClick={next} role="presentation">
      <section className="rpg-box inv-reward" role="dialog" aria-live="polite" aria-label="Reward">
        <p className="inv-reward__title">
          {entry.kind === 'card' ? 'CITY CARD ADDED' : 'ITEM OBTAINED'}
        </p>
        {entry.kind === 'card' ? (
          <CardFace card={entry.card} />
        ) : (
          <div className="inv-reward__item">
            <p className="inv-item__name">{entry.item.name}</p>
            <p className="inv-item__desc">{entry.item.description}</p>
          </div>
        )}
        <p className="inv-hint">
          <kbd>ENTER</kbd> OK
        </p>
      </section>
    </div>
  );
}
