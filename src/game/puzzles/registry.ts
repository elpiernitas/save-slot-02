import type { PuzzleDefinition, PuzzleId } from './types';

/** GAME-06 puzzles + PZ-03 (content expansion) (PUZZLE_BIBLE ids: semantic, stable). */
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
    // Always completes (the fallback), so it gates the terminal without blocking.
    optional: false,
    estimatedSeconds: 60,
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
