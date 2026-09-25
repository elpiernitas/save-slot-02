import type { Interactable, Prop, Rect, WorldMap } from '../types';
import LAYOUT from './muralla.layout.json';

/**
 * GAME-04 vertical slice: the street in front of La Muralla — the bar/café,
 * NOT a defensive wall — on an ordinary late afternoon in Cimavilla, Gijón.
 * Original and simplified (no real signage, no photo tracing).
 *
 * `muralla.layout.json` is the single source of truth shared with the art
 * generator (tools/art), so colliders follow the visible geometry.
 * Scale: a 40×60 character ≈ 1.75 m (~34 px per metre).
 */
export const MURALLA_W = LAYOUT.widthTiles;
export const MURALLA_H = LAYOUT.heightTiles;

const WIDTH = LAYOUT.widthTiles * LAYOUT.tile;
const FACADE_Y = LAYOUT.facadeBottom;

/** No solid tiles: architecture is described by colliders below. */
const TILES = Array.from({ length: MURALLA_H }, () => '.'.repeat(MURALLA_W));

/** Footprint (collider) centred on a ground anchor. */
const foot = (x: number, y: number, w: number, h: number): Rect => ({
  x: x - w / 2,
  y: y - h,
  w,
  h,
});

const TR = LAYOUT.terrace;
const TERRACE_FRONT = TR.y + TR.h;

/** Table + four chairs: compact, leaving walking lanes between tables. */
const tableFoot = (t: { x: number; y: number }) => foot(t.x, t.y + 3, 64, 16);
const EMPTY_TABLE = LAYOUT.tables.find((t) => t.id === 'tableEmpty')!;
const TREE_WEST = LAYOUT.trees.find((t) => t.id === 'treeWest')!;
const CLASS_BOLLARD = LAYOUT.bollards.find((b) => b.marked)!;
const WAITRESS = LAYOUT.waitress;

/** Something on the façade you look at from the sidewalk (facing up). */
const onFacade = (x: number, w: number): Rect => ({ x, y: FACADE_Y - 6, w, h: 6 });

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
    rect: foot(TREE_WEST.x, TREE_WEST.y + 2, 24, 12),
  },
  {
    id: 'board',
    label: 'pizarra',
    script: 'muralla.board',
    rect: foot(LAYOUT.board.x, LAYOUT.board.y + 2, 26, 10),
  },
  { id: 'table', label: 'mesa libre', script: 'muralla.table', rect: tableFoot(EMPTY_TABLE) },
  {
    id: 'bollard',
    label: 'bolardo',
    script: 'muralla.bollard',
    rect: foot(CLASS_BOLLARD.x, CLASS_BOLLARD.y + 2, 16, 10),
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
    rect: foot(WAITRESS.x, WAITRESS.y + 22, 26, 32),
  },
];

export const MURALLA_MAP: WorldMap = {
  id: 'muralla',
  displayName: 'LA MURALLA',
  timeOfDay: 'afternoon',
  background: 'background',
  foreground: 'foreground',
  walkers: LAYOUT.walkers,
  widthTiles: MURALLA_W,
  heightTiles: MURALLA_H,
  tiles: TILES,
  solidTiles: '',
  colliders: [
    // Façades (the player walks on the sidewalk in front of them).
    { x: 0, y: 0, w: WIDTH, h: FACADE_Y },
    // Curb and road at the bottom.
    { x: 0, y: LAYOUT.curbTop, w: WIDTH, h: MURALLA_H * LAYOUT.tile - LAYOUT.curbTop },
    // Glass windbreak: front (with the entrance gap) and both sides.
    { x: TR.x, y: TERRACE_FRONT - 4, w: TR.gapX - TR.x, h: 4 },
    { x: TR.gapX + TR.gapW, y: TERRACE_FRONT - 4, w: TR.x + TR.w - TR.gapX - TR.gapW, h: 4 },
    { x: TR.x - 1, y: TR.y, w: 6, h: TR.h },
    { x: TR.x + TR.w - 5, y: TR.y, w: 6, h: TR.h },
    ...LAYOUT.tables.map(tableFoot),
    ...LAYOUT.trees.map((t) => foot(t.x, t.y, 20, 10)),
    ...LAYOUT.planters.map((p) => foot(p.x, p.y, 26, 8)),
    ...LAYOUT.bollards.map((b) => foot(b.x, b.y, 10, 6)),
    foot(LAYOUT.bench.x, LAYOUT.bench.y, 70, 12),
    foot(LAYOUT.bike.x, LAYOUT.bike.y, 58, 8),
    foot(LAYOUT.board.x, LAYOUT.board.y, 24, 6),
    foot(LAYOUT.gull.x, LAYOUT.gull.y, 12, 4),
    // Deep footprint: PLAYER 1 stops a step away instead of covering her sprite.
    foot(WAITRESS.x, WAITRESS.y + 24, 20, 30),
  ],
  props: [
    ...LAYOUT.trees.map((t) => ({ id: t.id, sprite: 'tree', x: t.x, y: t.y, animMs: 1700 })),
    ...LAYOUT.tables.flatMap((t) => [
      { id: t.id, sprite: t.sprite, x: t.x, y: t.y },
      // Umbrella shares the table's anchor but always draws over it.
      ...(t.umbrella
        ? [{ id: `${t.id}Umbrella`, sprite: 'umbrella', x: t.x, y: t.y, baseY: t.y + 0.5 }]
        : []),
    ]),
    { id: 'windbreakWest', sprite: 'windbreakWest', x: TR.x, y: TERRACE_FRONT },
    { id: 'windbreakEast', sprite: 'windbreakEast', x: TR.gapX + TR.gapW, y: TERRACE_FRONT },
    ...windbreakSides,
    ...LAYOUT.planters.map((p, i) => ({ id: `planter${i}`, sprite: 'planter', x: p.x, y: p.y })),
    ...LAYOUT.bollards.map((b, i) => ({
      id: b.marked ? 'classBollard' : `bollard${i}`,
      sprite: b.marked ? 'bollardMarked' : 'bollard',
      x: b.x,
      y: b.y,
    })),
    { id: 'bench', sprite: 'bench', x: LAYOUT.bench.x, y: LAYOUT.bench.y },
    { id: 'bike', sprite: 'bike', x: LAYOUT.bike.x, y: LAYOUT.bike.y },
    { id: 'board', sprite: 'board', x: LAYOUT.board.x, y: LAYOUT.board.y },
    { id: 'gull', sprite: 'gull', x: LAYOUT.gull.x, y: LAYOUT.gull.y, animMs: 1300 },
  ],
  npcs: [{ id: 'waitress', sprite: 'waitress', x: WAITRESS.x, y: WAITRESS.y, facing: 'down' }],
  interactables,
  zones: [
    { id: 'arrival', rect: { x: 180, y: 304, w: 330, h: 88 }, spawn: 'arrival' },
    { id: 'terrace', rect: { x: TR.x + 6, y: TR.y, w: TR.w - 12, h: TR.h - 4 }, spawn: 'terrace' },
    { id: 'tree', rect: { x: 0, y: FACADE_Y, w: 170, h: 240 }, spawn: 'tree' },
    { id: 'portal', rect: { x: 700, y: FACADE_Y, w: 260, h: 240 }, spawn: 'portal' },
  ],
  spawns: [
    // Lower-left third, facing the café; the arrival text sits at the top.
    { id: 'arrival', x: 420, y: 346, facing: 'up' },
    { id: 'terrace', x: 510, y: 272, facing: 'up' },
    { id: 'tree', x: 120, y: 260, facing: 'right' },
    { id: 'portal', x: 760, y: 280, facing: 'left' },
  ],
  defaultSpawn: 'arrival',
};
