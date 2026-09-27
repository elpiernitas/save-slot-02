import { daysUntil, getDateOption, type DateOptionId } from '../calendar';

/** The one GAME-10 unlock: Randy on the final save slot. */
export const RANDY_UNLOCK = 'postgame.randy';

export const RANDY_LINE = 'Randy no tiene ni idea de qué significa nada de esto.';

/**
 * Post-game status of the chosen route, derived from the Madrid calendar at
 * day granularity (never stored, never a live countdown). After the date it
 * never claims what happened outside the game.
 */
export function postgameStatus(option: DateOptionId, now: Date): { label: string; value: string } {
  const days = daysUntil(getDateOption(option).dateKey, now);
  if (days > 1) return { label: 'PRÓXIMA MISIÓN', value: `EN ${days} DÍAS` };
  if (days === 1) return { label: 'PRÓXIMA MISIÓN', value: 'MAÑANA' };
  if (days === 0) return { label: 'RUTA ELEGIDA', value: 'HOY' };
  return { label: 'RUTA FIJADA', value: 'EL GUARDADO CONTINÚA' };
}
