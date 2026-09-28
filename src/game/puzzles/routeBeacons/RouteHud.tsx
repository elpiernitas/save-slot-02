import { BeaconIcon } from './BeaconIcon';
import { hintLevel, hudSlots, SYMBOL_LABEL, type BeaconState } from './routeBeacons';
import './routeBeacons.css';

const HINT = [
  'CALIBRACIÓN DE RUTA · SINCRONIZA LAS BALIZAS EN ORDEN',
  'PISTA · EL PATRÓN EMPIEZA POR EL PRIMER SÍMBOLO',
  'PISTA · SIGUE LAS CASILLAS DE IZQUIERDA A DERECHA',
];

const RECAL_HINT = 'RECALIBRACIÓN DE RUTA · SINCRONIZA LAS BALIZAS EN ORDEN';

/** Sequence progress under the location tag: filled = synced, ? = unknown. */
export function RouteHud({ state, recal = false }: { state: BeaconState; recal?: boolean }) {
  const slots = hudSlots(state);
  return (
    <div className="route-hud" aria-live="polite">
      <ol className="route-hud__slots" aria-label="Progreso de la ruta">
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
      <span className="route-hud__text">
        {state.rounds.length > 1 && `RUTA ${state.round + 1}/${state.rounds.length} · `}
        {recal && hintLevel(state) === 0 ? RECAL_HINT : HINT[hintLevel(state)]}
      </span>
    </div>
  );
}
