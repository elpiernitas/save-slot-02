/**
 * PLAYER 2 reveal beats (GAME_07_REVEAL_UI_SPEC §3, locked copy in
 * GAME_07_COPY). Staged one at a time; timed beats advance by themselves or
 * with Enter/click, the human line waits for the player. No timed reaction.
 */
export type BeatId = 'scan' | 'found' | 'slot' | 'name' | 'line' | 'party' | 'gate' | 'end';

export interface Beat {
  id: BeatId;
  /** Auto-advance after this long; null = waits for input (or play). */
  ms: number | null;
}

export const FULL_BEATS: readonly Beat[] = [
  { id: 'scan', ms: 1300 },
  { id: 'found', ms: 1600 },
  { id: 'slot', ms: 2600 },
  { id: 'name', ms: 2600 },
  { id: 'line', ms: null },
  { id: 'party', ms: 2600 },
  { id: 'gate', ms: null },
  { id: 'end', ms: 4200 },
];

/** Re-entry after a refresh mid-reveal: never the boss, a shorter reveal. */
export const COMPRESSED_BEATS: readonly Beat[] = FULL_BEATS.filter(
  (b) => b.id !== 'scan' && b.id !== 'slot',
);

/** Reveal already seen (story.player2Found): straight to the gate. */
export const GATE_BEATS: readonly Beat[] = FULL_BEATS.filter(
  (b) => b.id === 'gate' || b.id === 'end',
);

export const REVEAL_COPY = {
  scan: 'BUSCANDO LA ENTRADA PERDIDA...',
  found: 'SEÑAL ENCONTRADA',
  slot: 'RANURA DE JUGADOR 02',
  recovered: 'DATOS DE IDENTIDAD RECUPERADOS',
  name: 'PLAYER 2 — MANU',
  speaker: 'MANU',
  line: '¿me ha cargado bien por lo menos?',
  link: 'ENLACE DE JUGADORES — ESTABLE',
  party: 'GRUPO — 2/2',
  endA: 'DATOS DE LA ÚLTIMA MISIÓN SECUNDARIA RECUPERADOS',
  endB: 'DATOS DE RUTA DISPONIBLES',
} as const;

/** Beats that may be advanced with Enter/click (the gate is played). */
export const skippable = (b: Beat) => b.id !== 'gate';
