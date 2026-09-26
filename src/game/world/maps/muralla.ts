import type { Interactable, Rect, WorldMap } from '../types';
import LAYOUT from './muralla.layout.json';
import OCCLUDERS from './muralla.occluders.json';

/**
 * GAME-04 vertical slice: the street in front of La Muralla — the bar/café,
 * NOT a defensive wall — on an ordinary late afternoon in Cimavilla, Gijón.
 *
 * The background is ENV-001 (ChatGPT, final) used pixel for pixel: façade,
 * terrace (diners, umbrellas, waitress), bench, bike, tree and pedestrians
 * are painted in. Colliders keep PLAYER 1 on the sidewalk, so he is always
 * in front of the terrace and the bench and never walks behind them.
 *
 * Sidewalk furniture he CAN walk behind (lamp, board, bollards, bin, gulls)
 * is re-drawn as occluder sprites cut from the same ENV-001 pixels
 * (tools/art/occluders.mjs), placed where they were cut and depth-sorted.
 * PLAYER 1 uses `playerLarge` (CHAR-001 at exact ×2) to match the adults
 * painted in the reference (~100–110 px).
 *
 * Things he cannot walk up to (door, shop windows, waitress) are faced from
 * the nearest free ground. Coordinates: world px, 1:1 with ENV-001.
 *
 * `muralla.layout.json` now only feeds the placeholder generator (tools/art).
 */
export const MURALLA_W = LAYOUT.widthTiles;
export const MURALLA_H = LAYOUT.heightTiles;

const WIDTH = LAYOUT.widthTiles * LAYOUT.tile;
const HEIGHT = LAYOUT.heightTiles * LAYOUT.tile;

/** No solid tiles: everything is described by colliders below. */
const TILES = Array.from({ length: MURALLA_H }, () => '.'.repeat(MURALLA_W));

/** Rect from its edges (x0,y0)–(x1,y1). */
const box = (x0: number, y0: number, x1: number, y1: number): Rect => ({
  x: x0,
  y: y0,
  w: x1 - x0,
  h: y1 - y0,
});

/** Front edge of the painted terrace (chair legs), where PLAYER 1 stops. */
const TERRACE_FRONT = 297;

const interactables: Interactable[] = [
  { id: 'tree', label: 'árbol', script: 'muralla.tree', rect: box(50, 238, 96, 250) },
  { id: 'board', label: 'pizarra', script: 'muralla.board', rect: box(100, 290, 156, 297) },
  // GAME-06 route beacons also answer here (lamp, board = cup, gull = bird).
  { id: 'lamp', label: 'farola', script: 'muralla.lamp', rect: box(188, 312, 212, 320) },
  { id: 'gull', label: 'gaviota', script: 'muralla.gull', rect: box(158, 298, 176, 304) },
  {
    id: 'barWindowLeft',
    label: 'escaparate del bar',
    script: 'muralla.window',
    rect: box(226, TERRACE_FRONT - 6, 300, TERRACE_FRONT),
  },
  {
    id: 'table',
    label: 'terraza',
    script: 'muralla.table',
    rect: box(300, TERRACE_FRONT - 6, 478, TERRACE_FRONT),
  },
  {
    id: 'waitress',
    label: 'camarera',
    script: 'muralla.waitress',
    rect: box(480, TERRACE_FRONT - 6, 514, TERRACE_FRONT),
  },
  {
    id: 'barWindowRight',
    label: 'escaparate del bar',
    script: 'muralla.window',
    rect: box(514, TERRACE_FRONT - 6, 696, TERRACE_FRONT),
  },
  // The door sits behind the bench and planter: looked at from the sidewalk.
  { id: 'barDoor', label: 'puerta del bar', script: 'muralla.door', rect: box(700, 318, 750, 324) },
  { id: 'bollard', label: 'bolardo', script: 'muralla.bollard', rect: box(372, 324, 392, 334) },
];

export const MURALLA_MAP: WorldMap = {
  id: 'muralla',
  displayName: 'LA MURALLA',
  timeOfDay: 'afternoon',
  background: 'background',
  playerSprite: 'playerLarge',
  // FG-001 is pending; the old placeholder foreground would duplicate the
  // painted foliage, so no foreground layer is drawn until it arrives.
  widthTiles: MURALLA_W,
  heightTiles: MURALLA_H,
  tiles: TILES,
  solidTiles: '',
  colliders: [
    // Buildings, door steps and everything behind the terrace.
    box(0, 0, WIDTH, 240),
    // Terrace: tables, diners, umbrellas and the waitress (painted).
    box(220, 240, 722, TERRACE_FRONT),
    // Left planters and the door steps / right planters.
    box(148, 240, 246, 254),
    box(722, 240, WIDTH, 252),
    // Bench with the reader and the parked bike.
    box(722, 252, 940, 332),
    // Out-of-focus foreground bushes (bottom-left, right edge).
    box(0, 280, 110, HEIGHT),
    box(890, 252, WIDTH, HEIGHT),
    // Curb and road.
    box(0, 342, 480, HEIGHT),
    box(480, 356, WIDTH, HEIGHT),
    // Sidewalk furniture.
    box(40, 236, 100, 250), // tree trunk
    box(94, 284, 160, 297), // board
    box(188, 306, 212, 320), // street lamp
    box(158, 294, 176, 304), // gull (west)
    box(372, 320, 392, 334), // bollard
    box(534, 338, 556, 352), // bollard
    box(622, 330, 668, 354), // litter bin
    box(698, 300, 752, 324), // flower pot by the bench
    box(748, 342, 780, 356), // gull (east)
    box(850, 340, 870, 356), // bollard
  ],
  props: OCCLUDERS.map((o) => ({ id: o.id, sprite: o.id, x: o.x, y: o.y })),
  npcs: [],
  interactables,
  zones: [
    { id: 'tree', rect: box(0, 240, 300, 342), spawn: 'tree' },
    { id: 'arrival', rect: box(300, TERRACE_FRONT, 480, 342), spawn: 'arrival' },
    { id: 'terrace', rect: box(480, TERRACE_FRONT, 722, 356), spawn: 'terrace' },
    { id: 'portal', rect: box(722, 332, WIDTH, 356), spawn: 'portal' },
  ],
  spawns: [
    // Lower-left third, facing the café; the arrival text sits at the top.
    { id: 'arrival', x: 420, y: 336, facing: 'up' },
    { id: 'terrace', x: 497, y: 312, facing: 'up' },
    { id: 'tree', x: 240, y: 330, facing: 'left' },
    { id: 'portal', x: 815, y: 350, facing: 'left' },
  ],
  defaultSpawn: 'arrival',
};
