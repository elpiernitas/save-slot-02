import { describe, expect, it } from 'vitest';
import { cameraFor } from './camera';
import { checkpointFor, spawnForCheckpoint } from './checkpoint';
import { buildCollisionWorld } from './collision';
import { worldViewFromQuery } from './config';
import { findInteraction, probeRect, zoneAt } from './interaction';
import { MURALLA_MAP } from './maps/muralla';
import { feetRect, MAX_STEP_MS, stepMovement, WALK_SPEED } from './movement';
import { TILE_SIZE, type Interactable, type WorldMap } from './types';

/** 10×8 test room: walls around, one pillar in the middle. */
const ROOM: WorldMap = {
  id: 'room',
  displayName: 'ROOM',
  timeOfDay: 'morning',
  widthTiles: 10,
  heightTiles: 8,
  tiles: [
    '##########',
    '#........#',
    '#........#',
    '#...##...#',
    '#........#',
    '#........#',
    '#........#',
    '##########',
  ],
  solidTiles: '#',
  colliders: [{ x: 16 * 7, y: 16 * 5, w: 8, h: 8 }],
  props: [],
  npcs: [],
  interactables: [],
  zones: [{ id: 'east', rect: { x: 16 * 6, y: 16, w: 16 * 3, h: 16 * 6 }, spawn: 'east' }],
  spawns: [
    { id: 'start', x: 40, y: 40, facing: 'down' },
    { id: 'east', x: 130, y: 40, facing: 'left' },
  ],
  defaultSpawn: 'start',
};
const room = buildCollisionWorld(ROOM);

describe('collision', () => {
  it('blocks solid tiles, extra colliders and the map border', () => {
    expect(room.isBlocked({ x: 20, y: 20, w: 4, h: 4 })).toBe(false);
    expect(room.isBlocked({ x: 2, y: 20, w: 4, h: 4 })).toBe(true); // wall tile
    expect(room.isBlocked({ x: 16 * 7 + 2, y: 16 * 5 + 2, w: 2, h: 2 })).toBe(true); // collider
    expect(room.isBlocked({ x: -1, y: 20, w: 4, h: 4 })).toBe(true); // outside
  });
});

describe('movement', () => {
  const start = { x: 40, y: 40 };

  it('moves at constant speed in the held direction', () => {
    const r = stepMovement(start, 'down', 'right', 40, room);
    expect(r.pos).toEqual({ x: 40 + WALK_SPEED * 0.04, y: 40 });
    expect(r.facing).toBe('right');
    expect(r.moving).toBe(true);
  });

  it('only ever moves on one axis (4 directions, no diagonal speed-up)', () => {
    const r = stepMovement(start, 'down', 'up', 50, room);
    expect(r.pos.x).toBe(start.x);
    expect(Math.hypot(r.pos.x - start.x, r.pos.y - start.y)).toBeCloseTo(WALK_SPEED * 0.05);
  });

  it('stands still without input and clamps huge frame gaps', () => {
    expect(stepMovement(start, 'left', null, 16, room)).toEqual({
      pos: start,
      facing: 'left',
      moving: false,
    });
    const far = stepMovement(start, 'down', 'right', 5000, room);
    expect(far.pos.x - start.x).toBeCloseTo((WALK_SPEED * MAX_STEP_MS) / 1000);
  });

  it('stops flush against walls and still turns to face them', () => {
    let pos = { x: 30, y: 40 };
    for (let i = 0; i < 20; i++) pos = stepMovement(pos, 'left', 'left', 50, room).pos;
    const r = stepMovement(pos, 'down', 'left', 50, room);
    expect(r.moving).toBe(false);
    expect(r.facing).toBe('left');
    expect(feetRect(r.pos).x).toBeGreaterThanOrEqual(TILE_SIZE); // not inside the wall
    expect(feetRect(r.pos).x).toBeLessThan(TILE_SIZE + 1.5); // flush
  });
});

describe('camera', () => {
  const view = { w: 100, h: 60 };
  const map = { width: 300, height: 200 };
  it('centres on the target in whole pixels', () => {
    expect(cameraFor({ x: 150.4, y: 100.6 }, view, map)).toEqual({ x: 100, y: 71 });
  });
  it('clamps to the map edges', () => {
    expect(cameraFor({ x: 5, y: 5 }, view, map)).toEqual({ x: 0, y: 0 });
    expect(cameraFor({ x: 299, y: 199 }, view, map)).toEqual({ x: 200, y: 140 });
  });
  it('centres maps smaller than the view', () => {
    expect(cameraFor({ x: 0, y: 0 }, view, { width: 80, height: 40 })).toEqual({ x: -10, y: -10 });
  });
});

describe('interaction and zones', () => {
  const sign: Interactable = {
    id: 'sign',
    label: 'sign',
    script: 's',
    rect: { x: 36, y: 44, w: 8, h: 8 },
  };
  const lamp: Interactable = {
    id: 'lamp',
    label: 'lamp',
    script: 'l',
    rect: { x: 36, y: 20, w: 8, h: 8 },
  };

  it('only finds what the player is facing (frontal interaction)', () => {
    expect(findInteraction({ x: 40, y: 40 }, 'down', [sign, lamp])?.id).toBe('sign');
    expect(findInteraction({ x: 40, y: 40 }, 'up', [sign, lamp])?.id).toBe('lamp');
    expect(findInteraction({ x: 40, y: 40 }, 'left', [sign, lamp])).toBeNull();
  });

  it('probes a short distance in front of the feet', () => {
    const p = probeRect({ x: 40, y: 40 }, 'right');
    expect(p.x).toBeGreaterThan(40);
    expect(p.w).toBeLessThanOrEqual(12);
  });

  it('detects the zone under the feet', () => {
    expect(zoneAt({ x: 130, y: 40 }, ROOM.zones)?.id).toBe('east');
    expect(zoneAt({ x: 40, y: 40 }, ROOM.zones)).toBeNull();
  });
});

describe('checkpoints', () => {
  it('round-trips map + spawn ids and falls back safely', () => {
    expect(checkpointFor('room', 'east')).toBe('room:east');
    expect(spawnForCheckpoint(ROOM, 'room:east').id).toBe('east');
    expect(spawnForCheckpoint(ROOM, null).id).toBe('start');
    expect(spawnForCheckpoint(ROOM, 'other:east').id).toBe('start');
    expect(spawnForCheckpoint(ROOM, 'room:nowhere').id).toBe('start');
  });
});

describe('world resolution', () => {
  it('uses 640×360 by default; ?worldRes only works in development', () => {
    expect(worldViewFromQuery('', false)).toEqual({ w: 640, h: 360 });
    expect(worldViewFromQuery('?worldRes=480', true)).toEqual({ w: 480, h: 270 });
    expect(worldViewFromQuery('?worldRes=480', false)).toEqual({ w: 640, h: 360 });
    expect(worldViewFromQuery('?worldRes=999', true)).toEqual({ w: 640, h: 360 });
  });
});

describe('La Muralla map', () => {
  const map = MURALLA_MAP;
  const world = buildCollisionWorld(map);

  it('has a consistent tile grid', () => {
    expect(map.tiles).toHaveLength(map.heightTiles);
    for (const row of map.tiles) expect(row).toHaveLength(map.widthTiles);
  });

  it('spawns every player on free ground', () => {
    for (const spawn of map.spawns) expect(world.isBlocked(feetRect(spawn)), spawn.id).toBe(false);
    expect(map.spawns.map((s) => s.id)).toContain(map.defaultSpawn);
  });

  it('zones point to existing spawns inside themselves', () => {
    for (const zone of map.zones) {
      const spawn = map.spawns.find((s) => s.id === zone.spawn);
      expect(spawn, zone.id).toBeDefined();
      expect(zoneAt(spawn!, map.zones)?.id, zone.id).toBe(zone.id);
    }
  });

  it('every interactable can be reached and faced from free ground', () => {
    const facings = ['up', 'down', 'left', 'right'] as const;
    for (const item of map.interactables) {
      let reachable = false;
      for (let y = item.rect.y - 24; y <= item.rect.y + item.rect.h + 24 && !reachable; y += 2) {
        for (let x = item.rect.x - 24; x <= item.rect.x + item.rect.w + 24 && !reachable; x += 2) {
          if (world.isBlocked(feetRect({ x, y }))) continue;
          reachable = facings.some(
            (f) => findInteraction({ x, y }, f, map.interactables)?.id === item.id,
          );
        }
      }
      expect(reachable, item.id).toBe(true);
    }
  });

  it('has at least 3 interactables and one generic NPC', () => {
    expect(map.interactables.length).toBeGreaterThanOrEqual(3);
    expect(map.npcs).toHaveLength(1);
  });
});
