/**
 * GAME-09 ending + final save slot: copy and the pure status model. The
 * date always comes from the canonical calendar via the chosen option id;
 * no time or place is ever invented.
 */
import { chosenRouteLabel } from '../dateGate/routes';
import { PLAYER_CLASSES } from '../player/classes';
import type { GameSave } from '../state/types';

export type EndingBeatId = 'saving' | 'complete' | 'party' | 'route' | 'updated';

export interface EndingBeat {
  id: EndingBeatId;
  /** Auto-advance after this long; null = waits for the player. */
  ms: number | null;
}

export const ENDING_BEATS: readonly EndingBeat[] = [
  { id: 'saving', ms: 1800 },
  { id: 'complete', ms: 2200 },
  { id: 'party', ms: null },
  { id: 'route', ms: 3000 },
  { id: 'updated', ms: 2200 },
];

export const ENDING_COPY = {
  saving: 'SAVING...',
  checksum: 'CHECKSUM — OK',
  complete: 'SIDE QUEST — COMPLETE',
  speaker: 'MANU',
  line: 'bien. ahora ya solo falta hacer la parte que no cabe aquí.',
  route: 'DATE ROUTE',
  updated: 'SAVE SLOT 02 — UPDATED',
} as const;

export interface SlotRow {
  label: string;
  value: string;
}

/** The persistent SAVE SLOT 02 status. Null when the save is not complete. */
export function saveSlotRows(save: GameSave): SlotRow[] | null {
  const option = save.dateQuest.chosenOptionId;
  if (!save.timestamps.completedAt || !option) return null;
  const classId = save.player.classId;
  return [
    { label: 'PLAYER 1', value: (save.player.name ?? 'Luis').toUpperCase() },
    { label: 'CLASS', value: classId ? PLAYER_CLASSES[classId].displayName : '—' },
    { label: 'PLAYER 2', value: 'MANU' },
    { label: 'SIDE QUEST', value: 'COMPLETE' },
    { label: 'DATE ROUTE', value: chosenRouteLabel(option) },
  ];
}
