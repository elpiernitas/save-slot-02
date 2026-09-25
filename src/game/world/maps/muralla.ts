import { TILE_SIZE as T, type Interactable, type Prop, type Rect, type WorldMap } from '../types';
import LAYOUT from './muralla.layout.json';

/**
 * GAME-04 vertical slice: the street in front of La Muralla — the bar/café,
 * NOT a defensive wall — on an ordinary afternoon in Cimavilla, Gijón.
 * Original and simplified (no real signage, no photo tracing): bar frontage
 * and terrace with beige umbrellas and a glass windbreak, two big street
 * trees, apartment façades, granite paving, bollards along the curb.
 *
 * `muralla.layout.json` is the single source of truth shared with the art
 * generator (tools/art), so collisions always match the pixels.
 *
 * Tile legend:  B façade (solid)   . paving (walkable)   _ curb + road (solid)
 */
export const MURALLA_W = LAYOUT.widthTiles;
export const MURALLA_H = LAYOUT.heightTiles;

const FACADE_ROWS = LAYOUT.facadeBottom / T;
const CURB_ROW = LAYOUT.curbTop / T;

const TILES = Array.from({ length: MURALLA_H }, (_, row) =>
  (row < FACADE_ROWS ? 'B' : row >= CURB_ROW ? '_' : '.').repeat(MURALLA_W),
);

/** Footprint (collider) centred on a ground anchor. */
const foot = (x: number, y: number, w: number, h: number): Rect => ({
  x: x - w / 2,
  y: y - h,
  w,
  h,
});

const TR = LAYOUT.terrace;
const TERRACE_FRONT = TR.y + TR.h;

/** Table + four chairs (sprite `tableSet`); umbrella shares the anchor. */
const tableFoot = (t: { x: number; y: number }) => foot(t.x, t.y + 2, 56, 14);
const EMPTY_TABLE = LAYOUT.tables.find((t) => t.id === 'table3')!;

const TREE_WEST = LAYOUT.trees.find((t) => t.id === 'treeWest')!;
const trunk = (t: { x: number; y: number }) => foot(t.x, t.y, 14, 8);

const CLASS_BOLLARD = LAYOUT.bollards.find((b) => b.marked)!;
const FACADE_Y = LAYOUT.facadeBottom;

/** Something on the façade you look at from the sidewalk (facing up). */
const onFacade = (x: number, w: number): Rect => ({ x, y: FACADE_Y - 6, w, h: 6 });

const WAITRESS = LAYOUT.waitress;

const windbreakSides: Prop[] = [TR.x, TR.x + TR.w - 4].flatMap((x, side) =>
  Array.from({ length: Math.ceil(TR.h / 16) }, (_, i) => ({
    id: `windbreakSide${side}_${i}`,
    sprite: 'windbreakSide',
    x: x + 2,
    y: Math.min(TR.y + (i + 1) * 16, TERRACE_FRONT),
  })),
);

const interactables: Interactable[] = [
  {
    id: 'tree',
    label: 'árbol',
    script: 'muralla.tree',
    rect: foot(TREE_WEST.x, TREE_WEST.y + 1, 18, 10),
  },
  {
    id: 'board',
    label: 'pizarra',
    script: 'muralla.board',
    rect: foot(LAYOUT.board.x, LAYOUT.board.y + 1, 20, 8),
  },
  { id: 'table', label: 'mesa libre', script: 'muralla.table', rect: tableFoot(EMPTY_TABLE) },
  {
    id: 'bollard',
    label: 'bolardo',
    script: 'muralla.bollard',
    rect: foot(CLASS_BOLLARD.x, CLASS_BOLLARD.y + 1, 12, 8),
  },
  {
    id: 'portal',
    label: 'portal',
    script: 'muralla.portal',
    rect: onFacade(LAYOUT.portal.x, LAYOUT.portal.w),
  },
  {
    id: 'shutter',
    label: 'persiana',
    script: 'muralla.shutter',
    rect: onFacade(LAYOUT.shutter.x, LAYOUT.shutter.w),
  },
  {
    id: 'barWindowLeft',
    label: 'escaparate del bar',
    script: 'muralla.window',
    rect: onFacade(LAYOUT.barWindowLeft.x, LAYOUT.barWindowLeft.w),
  },
  {
    id: 'barWindowRight',
    label: 'escaparate del bar',
    script: 'muralla.window',
    rect: onFacade(LAYOUT.barWindowRight.x, LAYOUT.barWindowRight.w),
  },
  {
    id: 'barDoor',
    label: 'puerta del bar',
    script: 'muralla.door',
    rect: onFacade(LAYOUT.barDoor.x, LAYOUT.barDoor.w),
  },
  {
    id: 'waitress',
    label: 'camarera',
    script: 'muralla.waitress',
    rect: foot(WAITRESS.x, WAITRESS.y + 4, 18, 14),
  },
];

export const MURALLA_MAP: WorldMap = {
  id: 'muralla',
  displayName: 'LA MURALLA',
  timeOfDay: 'afternoon',
  background: 'background',
  widthTiles: MURALLA_W,
  heightTiles: MURALLA_H,
  tiles: TILES,
  solidTiles: 'B_',
  colliders: [
    // Glass windbreak: front (with the entrance gap) and both sides.
    { x: TR.x, y: TERRACE_FRONT - 4, w: TR.gapX - TR.x, h: 4 },
    { x: TR.gapX + TR.gapW, y: TERRACE_FRONT - 4, w: TR.x + TR.w - TR.gapX - TR.gapW, h: 4 },
    { x: TR.x - 1, y: TR.y, w: 6, h: TR.h },
    { x: TR.x + TR.w - 5, y: TR.y, w: 6, h: TR.h },
    ...LAYOUT.tables.map(tableFoot),
    ...LAYOUT.trees.map(trunk),
    ...LAYOUT.pots.map((p) => foot(p.x, p.y, 14, 8)),
    ...LAYOUT.bollards.map((b) => foot(b.x, b.y, 8, 5)),
    foot(LAYOUT.bench.x, LAYOUT.bench.y, 44, 10),
    foot(LAYOUT.board.x, LAYOUT.board.y, 18, 5),
    foot(LAYOUT.bin.x, LAYOUT.bin.y, 12, 6),
    foot(LAYOUT.gull.x, LAYOUT.gull.y, 10, 4),
    foot(WAITRESS.x, WAITRESS.y, 12, 6),
  ],
  props: [
    ...LAYOUT.trees.map((t) => ({ id: t.id, sprite: 'tree', x: t.x, y: t.y, animMs: 1700 })),
    ...LAYOUT.tables.map((t) => ({
      id: t.id,
      // Back row open, front row folded: keeps the terrace readable from 3/4 view.
      sprite: t.umbrella ? 'tableSet' : 'tableSetFolded',
      x: t.x,
      y: t.y,
    })),
    { id: 'windbreakWest', sprite: 'windbreakWest', x: TR.x, y: TERRACE_FRONT },
    { id: 'windbreakEast', sprite: 'windbreakEast', x: TR.gapX + TR.gapW, y: TERRACE_FRONT },
    ...windbreakSides,
    ...LAYOUT.pots.map((p, i) => ({ id: `pot${i}`, sprite: 'pot', x: p.x, y: p.y })),
    ...LAYOUT.bollards.map((b, i) => ({
      id: b.marked ? 'classBollard' : `bollard${i}`,
      sprite: b.marked ? 'bollardMarked' : 'bollard',
      x: b.x,
      y: b.y,
    })),
    { id: 'bench', sprite: 'bench', x: LAYOUT.bench.x, y: LAYOUT.bench.y },
    { id: 'board', sprite: 'board', x: LAYOUT.board.x, y: LAYOUT.board.y },
    { id: 'bin', sprite: 'bin', x: LAYOUT.bin.x, y: LAYOUT.bin.y },
    { id: 'gull', sprite: 'gull', x: LAYOUT.gull.x, y: LAYOUT.gull.y, animMs: 1300 },
  ],
  npcs: [{ id: 'waitress', sprite: 'waitress', x: WAITRESS.x, y: WAITRESS.y, facing: 'down' }],
  interactables,
  zones: [
    // Arrival: west end of the sidewalk, looking down the street at the bar
    // (high on screen, so the arrival text box never hides PLAYER 1).
    { id: 'arrival', rect: { x: 0, y: FACADE_Y, w: 200, h: 24 }, spawn: 'arrival' },
    { id: 'terrace', rect: { x: TR.x + 6, y: TR.y, w: TR.w - 12, h: TR.h - 4 }, spawn: 'terrace' },
    { id: 'tree', rect: { x: 0, y: FACADE_Y + 24, w: 200, h: 216 }, spawn: 'tree' },
    { id: 'portal', rect: { x: 520, y: 160, w: 280, h: 240 }, spawn: 'portal' },
  ],
  spawns: [
    { id: 'arrival', x: 96, y: 176, facing: 'right' },
    { id: 'terrace', x: 352, y: 262, facing: 'up' },
    { id: 'tree', x: 150, y: 250, facing: 'left' },
    { id: 'portal', x: 574, y: 176, facing: 'up' },
  ],
  defaultSpawn: 'arrival',
};
