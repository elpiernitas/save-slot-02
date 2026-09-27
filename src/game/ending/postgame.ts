import { daysUntil, getDateOption } from '../calendar';
import type { GameSave } from '../state/types';

/** The only post-game content unlock. It is intentionally tiny and local. */
export const POSTGAME_UNLOCKS = {
  randy: 'postgame.randy',
} as const;

export type PostgamePhase = 'future' | 'tomorrow' | 'today' | 'after';

export interface PostgameStatus {
  phase: PostgamePhase;
  label: string;
  daysUntil: number | null;
}

/**
 * Derives the SAVE SLOT note from the canonical Madrid calendar. No countdown
 * is stored, and no claim is made about what happens outside the game.
 */
export function postgameStatus(save: GameSave, now: Date): PostgameStatus {
  const optionId = save.dateQuest.chosenOptionId;
  if (!optionId) {
    return { phase: 'future', label: 'PRÓXIMA MISIÓN — FECHA PENDIENTE', daysUntil: null };
  }

  const remaining = daysUntil(getDateOption(optionId).dateKey, now);
  if (remaining > 1) {
    return {
      phase: 'future',
      label: `PRÓXIMA MISIÓN — EN ${remaining} DÍAS`,
      daysUntil: remaining,
    };
  }
  if (remaining === 1) return { phase: 'tomorrow', label: 'PRÓXIMA MISIÓN — MAÑANA', daysUntil: 1 };
  if (remaining === 0) return { phase: 'today', label: 'RUTA ELEGIDA — HOY', daysUntil: 0 };
  return { phase: 'after', label: 'RUTA FIJADA — EL GUARDADO CONTINÚA', daysUntil: remaining };
}
