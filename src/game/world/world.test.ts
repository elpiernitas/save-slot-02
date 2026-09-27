import { describe, expect, it } from 'vitest';
import { CAMERA_DEAD_ZONE, cameraFor, followCamera } from './camera';
import { checkpointFor, spawnForCheckpoint } from './checkpoint';
import { buildCollisionWorld } from './collision';
import { worldViewFromQuery } from './config';
import { findInteraction, probeRect, REACH, zoneAt } from './interaction';
import { SPRITES, SPRITE_URLS, spriteSizeProblem } from './art/assets';
import { MURALLA_MAP } from './maps/muralla';
import { walkerPose } from './render/canvasRenderer';
import { feetRect, MAX_STEP_MS, stepMovement, WALK_SPEED } from './movement';
import { TILE_SIZE, type Interactable, type WorldMap } from './types';

/** 10×8 test room: walls around, one pillar in the middle. */
const ROOM: WorldMap = {
  id: 'room',
  displayName: 'ROOM',
  timeOfDay: 'morning',
  background: 'room',
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
  it('soft follow: stays still inside the dead zone', () => {
    const cam = cameraFor({ x: 150, y: 100 }, view, map);
    const nudged = { x: 150 + CAMERA_DEAD_ZONE.x - 1, y: 100 - CAMERA_DEAD_ZONE.y + 1 };
    expect(followCamera(cam, nudged, view, map, 16)).toEqual(cam);
  });

  it('soft follow: eases towards the target and never overshoots the clamp', () => {
    const cam = { x: 0, y: 0 };
    const far = { x: 299, y: 199 };
    const step = followCamera(cam, far, view, map, 16);
    expect(step.x).toBeGreaterThan(0);
    expect(step.x).toBeLessThan(200);
    let c = cam;
    for (let i = 0; i < 200; i++) c = followCamera(c, far, view, map, 16);
    expect(c).toEqual({ x: 200, y: 140 }); // settles on the clamped edge
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
    expect(p.w).toBeLessThanOrEqual(REACH);
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

  it('draws only sprites that exist in the art manifest', () => {
    const ids = [
      map.background,
      'player',
      ...map.props.map((p) => p.sprite),
      ...map.npcs.map((n) => n.sprite),
    ];
    for (const id of ids) {
      expect(SPRITES[id], id).toBeDefined();
      expect(SPRITE_URLS[id], id).toBeDefined();
    }
    const bg = SPRITES[map.background]!;
    expect([bg.width, bg.height]).toEqual([
      map.widthTiles * TILE_SIZE,
      map.heightTiles * TILE_SIZE,
    ]);
  });

  it('flags a replacement PNG whose size does not match the manifest', () => {
    expect(spriteSizeProblem('player', 120, 240)).toBeNull();
    expect(spriteSizeProblem('player', 128, 240)).toMatch(/expects 120×240/);
    expect(spriteSizeProblem('nope', 1, 1)).toMatch(/Unknown sprite/);
  });

  it('every sprite declares its transparency contract', () => {
    for (const [id, info] of Object.entries(SPRITES)) {
      expect(typeof info.transparent, id).toBe('boolean');
    }
    expect(SPRITES.background!.transparent).toBe(false);
    expect(SPRITES.player!.transparent).toBe(true);
  });

  it('every sprite declares whether it is a placeholder or approved art', () => {
    for (const [id, info] of Object.entries(SPRITES)) {
      expect(['placeholder', 'final'], id).toContain(info.status);
    }
  });

  it('uses a large, readable player sprite (40×60, 4 directions × 3 frames)', () => {
    const player = SPRITES.player!;
    expect([player.frameWidth, player.frameHeight]).toEqual([40, 60]);
    expect([player.frames, player.rows]).toEqual([3, 4]);
  });

  it('is the bar and its terrace, not a fortress: no wall or gate left', () => {
    const ids = map.interactables.map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['barDoor', 'barWindowLeft', 'table', 'waitress']));
    for (const banned of ['wall', 'gate']) expect(ids).not.toContain(banned);
  });

  it('draws La Muralla as ENV + WORLD + FG-001 layers cut from ENV-001', () => {
    expect(SPRITES[map.background]!.status).toBe('final');
    expect(map.foreground).toBe('foreground');
    expect(SPRITES.foreground!.status).toBe('final');
    expect(SPRITES.foreground!.transparent).toBe(true);
    const ids = map.props.map((p) => p.sprite);
    for (const piece of ['worldTerrace', 'worldBench', 'worldTree', 'worldPlanters']) {
      expect(ids).toContain(piece);
    }
    for (const prop of map.props) {
      expect(prop.sprite, prop.id).toMatch(/^(occ|world)/);
      expect(SPRITES[prop.sprite]!.status, prop.id).toBe('final');
    }
    expect(map.npcs).toEqual([]);
    expect(map.walkers ?? []).toEqual([]);
  });

  it('shows PLAYER 1 at the reference proportion: CHAR-001 at exact ×2', () => {
    const base = SPRITES.player!;
    const large = SPRITES[map.playerSprite!]!;
    expect(map.playerSprite).toBe('playerLarge');
    expect([large.frameWidth, large.frameHeight]).toEqual([
      base.frameWidth * 2,
      base.frameHeight * 2,
    ]);
    expect([large.frames, large.rows]).toEqual([base.frames, base.rows]);
  });

  it('the bar door is faced from the sidewalk next to the terrace', () => {
    let pos = { x: 725, y: 350 };
    for (let i = 0; i < 30; i++) pos = stepMovement(pos, 'up', 'up', 50, world).pos;
    expect(world.isBlocked(feetRect(pos))).toBe(false);
    expect(findInteraction(pos, 'up', map.interactables)?.id).toBe('barDoor');
  });

  it('no walk-through: every prop and NPC stands on a collider (single PLAYER 1)', () => {
    // A 1×1 probe at the middle of each sprite's ground line must be solid,
    // so PLAYER 1 can never stand on (and draw over) what it depicts.
    for (const s of [...map.props, ...map.npcs]) {
      const info = SPRITES[s.sprite]!;
      const midX = s.x - info.anchorX + info.frameWidth / 2;
      expect(world.isBlocked({ x: midX - 0.5, y: s.y - 1.5, w: 1, h: 1 }), s.id).toBe(true);
    }
    // PLAYER 1 is only ever the dynamic player sprite.
    const playerArt = ['player', 'playerLarge'];
    expect([...map.props, ...map.npcs].some((s) => playerArt.includes(s.sprite))).toBe(false);
  });

  it('background walkers pace back and forth inside their lane', () => {
    const walker = { sprite: 'walkerA', y: 100, x0: 0, x1: 100, speed: 50, phase: 0 };
    expect(walkerPose(walker, 1000)).toMatchObject({ x: 50, facing: 'right' });
    expect(walkerPose(walker, 3000)).toMatchObject({ x: 50, facing: 'left' });
    for (let t = 0; t < 10000; t += 370) {
      const { x } = walkerPose(walker, t);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
    }
  });

  it('has at least 3 interactables, the waitress among them', () => {
    expect(map.interactables.length).toBeGreaterThanOrEqual(3);
    expect(map.interactables.map((i) => i.id)).toContain('waitress');
  });
});
