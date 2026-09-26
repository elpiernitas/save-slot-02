import type { Interactable, Rect, WorldMap } from '../types';
import LAYOUT from './muralla.layout.json';

/**
 * GAME-04 vertical slice: the street in front of La Muralla — the bar/café,
 * NOT a defensive wall — on an ordinary late afternoon in Cimavilla, Gijón.
 *
 * The background is ENV-001 (ChatGPT, final): façade, terrace, diners, the
 * waitress, pedestrians, tree, bench, bike, gulls, lamps and light are all
 * painted into it. The map therefore draws no decorative sprites; it only
 * describes where PLAYER 1 can walk and what can be looked at, measured on
 * ENV-001 in world pixels (1:1 with the image).
 *
 * The art is a front view with little free paving: PLAYER 1 walks the
 * sidewalk strip in front of the terrace and the corner by the tree. Things
 * he cannot walk up to (door, shop windows, waitress) are faced from the
 * nearest free ground.
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
  {
    id: 'barWindowLeft',
    label: 'escaparate del bar',
    script: 'muralla.window',
    rect: box(226, TERRACE_FRONT - 6, 300, TERRACE_FRONT),
  },
  {
    id: 'table',
    label: 'mesa libre',
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
  props: [],
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
