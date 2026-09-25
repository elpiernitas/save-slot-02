import { TILE_SIZE as T, type Rect, type WorldMap } from '../types';

/**
 * GAME-04 vertical slice: an original, simplified take on La Muralla /
 * edge of Cimavilla in the afternoon (WORLD_BIBLE §3–4, ART_DIRECTION_V1).
 * Not a map of the real place: an old stone wall with a closed gate to the
 * north, a café with a terrace to the east, a big tree to the west, cobbles
 * in between and the street (not walkable) to the south.
 *
 * Tile legend:
 *   T wall top   W stone wall   G gate (closed)   F café building
 *   . cobbles    , stone slabs  " planting strip
 *   _ curb       = road         z zebra crossing
 */
export const MURALLA_W = 48;
export const MURALLA_H = 30;

type Fill = [char: string, x0: number, y0: number, x1: number, y1: number];

function paint(fills: readonly Fill[]): string[] {
  const grid = Array.from({ length: MURALLA_H }, () => Array<string>(MURALLA_W).fill('.'));
  for (const [char, x0, y0, x1, y1] of fills) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y]![x] = char;
  }
  return grid.map((row) => row.join(''));
}

const TILES = paint([
  ['T', 0, 0, 34, 0],
  ['W', 0, 1, 34, 5],
  ['G', 22, 3, 25, 5],
  ['F', 35, 0, 47, 12],
  ['"', 0, 6, 34, 6],
  [',', 22, 6, 25, 23],
  ['_', 0, 24, 47, 24],
  ['=', 0, 25, 47, 29],
  ['z', 21, 25, 26, 29],
]);

const px = (tiles: number) => tiles * T;

/** Terrace tables: sprite 24×14, collision on the table + chairs footprint. */
const TABLES = [
  { id: 'table1', x: px(34) + 4, y: px(14) + 6 },
  { id: 'table2', x: px(39) + 4, y: px(14) + 6 },
  { id: 'table3', x: px(44) + 2, y: px(14) + 6 },
  { id: 'table4', x: px(36) + 8, y: px(18) + 2 },
  { id: 'table5', x: px(42) + 4, y: px(18) + 2 },
] as const;

const tableCollider = (t: { x: number; y: number }): Rect => ({
  x: t.x + 1,
  y: t.y + 5,
  w: 22,
  h: 8,
});

const BOLLARD_XS = [2, 6, 10, 14, 18, 29, 33, 37, 41, 45];
const bollardX = (tx: number) => px(tx) + 5;
const BOLLARD_Y = px(23) + 1; // sprite 6×14, base on row 23

/** The bollard that talks back (class variant) sits by the slab path. */
const CLASS_BOLLARD = { x: px(20) + 5, y: BOLLARD_Y };

const PLANTERS = [3, 8, 13, 28, 32];

const TREE_TRUNK = { x: px(9) + 10, y: px(14) + 6, w: 14, h: 8 };
/** Tree sprite is 72×88 with the roots on row 82. */
const TREE = { x: px(8), y: TREE_TRUNK.y + TREE_TRUNK.h - 83, trunk: TREE_TRUNK };
const LAMP = { x: px(29) + 4, y: px(10) };
const SIGN = { x: px(16), y: px(18) - 2 };
const BENCH = { x: px(12) + 4, y: px(15) + 4 };

export const MURALLA_MAP: WorldMap = {
  id: 'muralla',
  displayName: 'LA MURALLA',
  timeOfDay: 'afternoon',
  widthTiles: MURALLA_W,
  heightTiles: MURALLA_H,
  tiles: TILES,
  solidTiles: 'TWGF_=z',
  colliders: [
    ...TABLES.map(tableCollider),
    ...BOLLARD_XS.map((tx) => ({ x: bollardX(tx), y: BOLLARD_Y + 8, w: 6, h: 5 })),
    { x: CLASS_BOLLARD.x, y: CLASS_BOLLARD.y + 8, w: 6, h: 5 },
    ...PLANTERS.map((tx) => ({ x: px(tx), y: px(7) - 2, w: 18, h: 8 })),
    TREE.trunk,
    { x: LAMP.x + 2, y: LAMP.y + 40, w: 4, h: 4 },
    { x: SIGN.x + 4, y: SIGN.y + 24, w: 14, h: 4 },
    { x: BENCH.x, y: BENCH.y + 6, w: 30, h: 6 },
    // Waitress
    { x: px(33) + 2, y: px(16) + 2, w: 10, h: 6 },
  ],
  props: [
    { id: 'tree', sprite: 'tree', x: TREE.x, y: TREE.y, baseY: TREE.trunk.y + TREE.trunk.h },
    { id: 'bench', sprite: 'bench', x: BENCH.x, y: BENCH.y },
    { id: 'lamp', sprite: 'lamp', x: LAMP.x, y: LAMP.y },
    { id: 'sign', sprite: 'sign', x: SIGN.x, y: SIGN.y },
    ...PLANTERS.map((tx, i) => ({ id: `planter${i}`, sprite: 'planter', x: px(tx), y: px(7) - 8 })),
    ...BOLLARD_XS.map((tx, i) => ({
      id: `bollard${i}`,
      sprite: 'bollard',
      x: bollardX(tx),
      y: BOLLARD_Y,
    })),
    { id: 'classBollard', sprite: 'bollardMarked', x: CLASS_BOLLARD.x, y: CLASS_BOLLARD.y },
    ...TABLES.flatMap((t) => [
      { id: t.id, sprite: 'tableSet', x: t.x, y: t.y },
      // Parasol shares the table's base so they sort together.
      { id: `${t.id}Parasol`, sprite: 'parasol', x: t.x - 4, y: t.y - 24, baseY: t.y + 14 },
    ]),
  ],
  npcs: [{ id: 'waitress', sprite: 'waitress', x: px(33) + 7, y: px(16) + 8, facing: 'left' }],
  interactables: [
    {
      id: 'wall',
      label: 'muralla',
      script: 'muralla.wall',
      rect: { x: px(4), y: px(5) + 8, w: px(6), h: 8 },
    },
    {
      id: 'gate',
      label: 'puerta',
      script: 'muralla.gate',
      rect: { x: px(22), y: px(5) + 8, w: px(4), h: 8 },
    },
    {
      id: 'tree',
      label: 'árbol',
      script: 'muralla.tree',
      rect: { ...TREE.trunk, x: TREE.trunk.x - 2, w: TREE.trunk.w + 4 },
    },
    {
      id: 'sign',
      label: 'cartel',
      script: 'muralla.sign',
      rect: { x: SIGN.x, y: SIGN.y + 20, w: 22, h: 10 },
    },
    { id: 'table', label: 'mesa libre', script: 'muralla.table', rect: tableCollider(TABLES[3]) },
    {
      id: 'bollard',
      label: 'bolardo',
      script: 'muralla.bollard',
      rect: { x: CLASS_BOLLARD.x - 2, y: CLASS_BOLLARD.y + 6, w: 10, h: 9 },
    },
    {
      id: 'waitress',
      label: 'camarera',
      script: 'muralla.waitress',
      rect: { x: px(33), y: px(16) - 2, w: 14, h: 12 },
    },
  ],
  zones: [
    { id: 'arrival', rect: { x: px(18), y: px(19), w: px(12), h: px(5) }, spawn: 'arrival' },
    { id: 'gate', rect: { x: px(18), y: px(6), w: px(12), h: px(5) }, spawn: 'gate' },
    { id: 'tree', rect: { x: 0, y: px(8), w: px(17), h: px(15) }, spawn: 'tree' },
    { id: 'terrace', rect: { x: px(31), y: px(13), w: px(17), h: px(10) }, spawn: 'terrace' },
  ],
  spawns: [
    { id: 'arrival', x: px(24), y: px(22), facing: 'up' },
    { id: 'gate', x: px(24), y: px(6) + 8, facing: 'up' },
    { id: 'tree', x: px(14), y: px(19), facing: 'left' },
    { id: 'terrace', x: px(31), y: px(17), facing: 'right' },
  ],
  defaultSpawn: 'arrival',
};
