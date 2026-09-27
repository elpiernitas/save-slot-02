import { ROUTE_FLAGS } from '../content/dialogue/route';
import { STORY_FLAGS } from '../boss/story';
import { BEACONS_ID, SEAGULL_ID, TERMINAL_ID } from '../puzzles/chapter';
import type { GameSave } from '../state/types';

/**
 * Visible story chapters. These are progression labels, not player stats or
 * a second save system. The level is derived from evidence already persisted
 * in GameSave so a refresh can never move the player backwards.
 */
export const CHAPTERS = [
  {
    level: 1,
    title: 'LA MURALLA / LA SEÑAL',
    objective: 'Habla con la camarera.',
    scene: 'overworld',
  },
  {
    level: 2,
    title: 'LA RUTA PERDIDA',
    objective: 'Sigue la secuencia de balizas.',
    scene: 'overworld',
  },
  {
    level: 3,
    title: 'PROTOCOLO DE LA GAVIOTA',
    objective: 'Descubre qué está señalando la sombra.',
    scene: 'overworld',
  },
  {
    level: 4,
    title: 'TERMINAL DE SINCRONIZACIÓN',
    objective: 'Lleva la señal hasta la salida.',
    scene: 'overworld',
  },
  {
    level: 5,
    title: 'DESYNC PROCESS / JEFE FINAL',
    objective: 'Estabiliza el proceso hostil.',
    scene: 'boss',
  },
  {
    level: 6,
    title: 'PLAYER 2 / LA PUERTA',
    objective: 'Completa la puerta cooperativa.',
    scene: 'player2Reveal',
  },
  {
    level: 7,
    title: 'RUTA ELEGIDA',
    objective: 'Elige cuándo continúa la misión.',
    scene: 'dateGate',
  },
] as const;

export type ChapterLevel = (typeof CHAPTERS)[number]['level'];
export type Chapter = (typeof CHAPTERS)[number];

/** Current chapter, derived only from completed narrative work. */
export function chapterLevel(save: GameSave): ChapterLevel {
  if (save.dateQuest.chosenOptionId || save.flags[STORY_FLAGS.player2GateComplete]) return 7;
  if (save.boss.defeated) return 6;
  if (Object.hasOwn(save.puzzles, TERMINAL_ID)) return 5;
  if (Object.hasOwn(save.puzzles, SEAGULL_ID)) return 4;
  if (Object.hasOwn(save.puzzles, BEACONS_ID)) return 3;
  if (save.flags[ROUTE_FLAGS.updated]) return 2;
  return 1;
}

export function chapterFor(save: GameSave): Chapter {
  return CHAPTERS[chapterLevel(save) - 1]!;
}

/** Generic one-shot flag used by the chapter card; it is safe to persist. */
export function chapterSeenFlag(level: ChapterLevel): string {
  return `chapter.seen.${String(level).padStart(2, '0')}`;
}
