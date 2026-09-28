import { BEACONS_ID, recalibrationDone, SEAGULL_ID, TERMINAL_ID } from '../puzzles/chapter';
import { ROUTE_FLAGS } from '../content/dialogue/route';
import { STORY_FLAGS } from '../boss/story';
import type { GameSave } from '../state/types';

/**
 * Visible adventure chapters (content expansion). A level is never stored:
 * it is read from what the save proves is done, so it can never disagree
 * with the story and needs no new save field. Each level is a real goal.
 */
export interface Level {
  n: number;
  title: string;
  /** One line: what to do now (shown under the chapter title). */
  objective: string;
}

export const LEVELS: readonly Level[] = [
  { n: 1, title: 'LA MURALLA / LA SEÑAL', objective: 'Habla con la camarera de la terraza.' },
  { n: 2, title: 'LA RUTA PERDIDA', objective: 'Sincroniza las tres balizas siguiendo el patrón.' },
  {
    n: 3,
    title: 'PROTOCOLO DE LA GAVIOTA',
    objective: 'Algo interfiere en la ruta: busca a la gaviota.',
  },
  {
    n: 4,
    title: 'TERMINAL DE SINCRONIZACIÓN',
    objective: 'Entra por el acceso de servicio del nº 12.',
  },
  {
    n: 5,
    title: 'DESYNC PROCESS / JEFE FINAL',
    objective: 'Estabiliza la señal: derrota al proceso DESYNC.',
  },
  { n: 6, title: 'PLAYER 2 / LA PUERTA', objective: 'Abre la puerta entre los dos.' },
  { n: 7, title: 'RUTA ELEGIDA', objective: 'Elige la ruta.' },
];

/** NIVEL 04 after the terminal: the route must be recalibrated (D-085). */
const RECALIBRATION: Level = {
  ...LEVELS[3]!,
  objective: 'Recalibra la ruta: sigue el nuevo patrón de balizas.',
};

export const levelLabel = (n: number) => `NIVEL ${String(n).padStart(2, '0')}`;

/** Where the adventure stands (pure). */
export function chapterLevel(save: GameSave): Level {
  const has = (id: string) => Object.hasOwn(save.puzzles, id);
  let n = 1;
  if (save.dateQuest.chosenOptionId || save.flags[STORY_FLAGS.player2GateComplete]) n = 7;
  else if (save.boss.defeated) n = 6;
  else if (has(TERMINAL_ID)) {
    if (!recalibrationDone(save)) return RECALIBRATION;
    n = 5;
  } else if (has(SEAGULL_ID)) n = 4;
  else if (has(BEACONS_ID)) n = 3;
  else if (save.flags[ROUTE_FLAGS.updated]) n = 2;
  return LEVELS[n - 1]!;
}

/** Generic flag recording that a level's title card was shown once. */
export const chapterSeenFlag = (n: number) => `chapter.seen.${String(n).padStart(2, '0')}`;

export const chapterCardDue = (save: GameSave, n = chapterLevel(save).n) =>
  !save.flags[chapterSeenFlag(n)];

/**
 * The chapter card to show now, if any. `justClosed` is the level whose card
 * was just dismissed: a save read before that dismissal is committed still
 * lacks its seen flag, and must never bring the same card back (D-087).
 */
export function chapterCardToShow(save: GameSave, justClosed: number | null = null): Level | null {
  const level = chapterLevel(save);
  return level.n !== justClosed && chapterCardDue(save, level.n) ? level : null;
}
