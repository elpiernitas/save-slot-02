import { BeaconIcon } from './BeaconIcon';
import { hintLevel, hudSlots, SYMBOL_LABEL, type BeaconState } from './routeBeacons';
import './routeBeacons.css';

const HINT = [
  'CALIBRACIÓN DE RUTA · SINCRONIZA LAS BALIZAS EN ORDEN',
  'PISTA · EL PATRÓN EMPIEZA POR EL PRIMER SÍMBOLO',
  'PISTA · SIGUE LAS CASILLAS DE IZQUIERDA A DERECHA',
];

/** Sequence progress under the location tag: filled = synced, ? = unknown. */
export function RouteHud({ state }: { state: BeaconState }) {
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
      <span className="route-hud__text">{HINT[hintLevel(state)]}</span>
    </div>
  );
}
