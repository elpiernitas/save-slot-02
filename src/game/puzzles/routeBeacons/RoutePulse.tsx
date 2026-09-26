import { useEffect, useState } from 'react';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import { BeaconIcon } from './BeaconIcon';
import { SYMBOL_LABEL, type BeaconSymbol } from './routeBeacons';
import './routeBeacons.css';

const STEP_MS = 750;

/**
 * The calibration pattern, shown once in order (GAME_06_SPEC §9). Each symbol
 * lights up in turn with its position number, so order is readable without
 * sound or colour. Replayable at the route node.
 */
export function RoutePulse({
  sequence,
  onDone,
}: {
  sequence: readonly BeaconSymbol[];
  onDone: () => void;
}) {
  const { services } = useGame();
  const [lit, setLit] = useState(0);
  const finished = lit >= sequence.length;

  useEffect(() => {
    if (finished) return;
    const id = window.setTimeout(() => {
      services.audio.playSfx('cursor');
      setLit((n) => n + 1);
    }, STEP_MS);
    return () => window.clearTimeout(id);
  }, [lit, finished, services.audio]);

  useInput(
    (input, { repeat }) => {
      if (!repeat && finished && (input === 'confirm' || input === 'cancel')) {
        services.audio.playSfx('confirm');
        onDone();
      }
    },
    { priority: INPUT_PRIORITY.panel },
  );

  return (
    <div className="inv-layer" onClick={() => finished && onDone()} role="presentation">
      <section
        className="rpg-box route-pulse"
        role="dialog"
        aria-label="Route calibration"
        aria-live="polite"
      >
        <p className="route-pulse__title">ROUTE CALIBRATION</p>
        <ol className="route-pulse__row">
          {sequence.map((symbol, i) => (
            <li key={symbol} className="route-pulse__slot" data-lit={i < lit || undefined}>
              <span className="route-pulse__n">{i + 1}</span>
              <BeaconIcon symbol={symbol} label={SYMBOL_LABEL[symbol]} />
              <span className="route-pulse__name">{SYMBOL_LABEL[symbol]}</span>
            </li>
          ))}
        </ol>
        <p className="inv-hint">
          {finished ? (
            <>
              <kbd>ENTER</kbd> OK
            </>
          ) : (
            'RECEIVING…'
          )}
        </p>
      </section>
    </div>
  );
}
