import type { Spawn, WorldMap } from './types';

/**
 * Resume points are saved as `progress.checkpoint = "<mapId>:<spawnId>"`
 * (existing string field: no save-shape change). Only the last zone entered
 * is stored, never the exact position or engine state.
 */
export function checkpointFor(mapId: string, spawnId: string): string {
  return `${mapId}:${spawnId}`;
}

export function spawnForCheckpoint(map: WorldMap, checkpoint: string | null): Spawn {
  const fallback = map.spawns.find((s) => s.id === map.defaultSpawn)!;
  if (!checkpoint) return fallback;
  const [mapId, spawnId] = checkpoint.split(':');
  if (mapId !== map.id) return fallback;
  return map.spawns.find((s) => s.id === spawnId) ?? fallback;
}
