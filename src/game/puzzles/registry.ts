import type { PuzzleDefinition, PuzzleId } from './types';

/** GAME-06 puzzles (PUZZLE_BIBLE ids: semantic, stable). */
export const PUZZLES = {
  'route.muralla_beacons': {
    id: 'route.muralla_beacons',
    title: 'BALIZAS DE RUTA',
    kind: 'routeSequence',
    optional: false,
    estimatedSeconds: 90,
  },
  'route.seagull_protocol': {
    id: 'route.seagull_protocol',
    title: 'PROTOCOLO DE LA GAVIOTA',
    kind: 'microgame',
    optional: false,
    estimatedSeconds: 120,
  },
  'system.player_sync': {
    id: 'system.player_sync',
    title: 'TERMINAL DE SINCRONIZACIÓN',
    kind: 'syncGrid',
    optional: false,
    estimatedSeconds: 90,
  },
} as const satisfies Record<PuzzleId, PuzzleDefinition>;

export type KnownPuzzleId = keyof typeof PUZZLES;

const ALL: Readonly<Record<PuzzleId, PuzzleDefinition>> = PUZZLES;

export function puzzleDefinition(id: PuzzleId): PuzzleDefinition | undefined {
  return Object.hasOwn(ALL, id) ? ALL[id] : undefined;
}
