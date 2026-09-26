import { BeaconIcon } from './BeaconIcon';
import { hintLevel, hudSlots, SYMBOL_LABEL, type BeaconState } from './routeBeacons';
import './routeBeacons.css';

const HINT = [
  'ROUTE CALIBRATION · SYNC THE BEACONS IN ORDER',
  'HINT · THE PATTERN STARTS AT THE FIRST SYMBOL',
  'HINT · FOLLOW THE SLOTS LEFT TO RIGHT',
];

/** Sequence progress under the location tag: filled = synced, ? = unknown. */
export function RouteHud({ state }: { state: BeaconState }) {
  const slots = hudSlots(state);
  return (
    <div className="route-hud" aria-live="polite">
      <ol className="route-hud__slots" aria-label="Route progress">
        {slots.map((slot, i) => (
          <li key={i} className="route-hud__slot" data-synced={slot.synced || undefined}>
            {slot.symbol ? (
              <BeaconIcon symbol={slot.symbol} label={`${i + 1}: ${SYMBOL_LABEL[slot.symbol]}`} />
            ) : (
              <span aria-label={`${i + 1}: ?`}>?</span>
            )}
          </li>
        ))}
      </ol>
      <span className="route-hud__text">{HINT[hintLevel(state)]}</span>
    </div>
  );
}
