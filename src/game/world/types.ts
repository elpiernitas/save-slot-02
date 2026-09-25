/**
 * Exploration data model. Maps are plain data (no functions) so they can be
 * validated in tests and rendered by any engine. Units are world pixels;
 * 1 tile = TILE_SIZE px.
 */
export const TILE_SIZE = 16;

export type Facing = 'up' | 'down' | 'left' | 'right';

export interface Vec2 {
  x: number;
  y: number;
}

/** Axis-aligned rectangle (x, y = top-left). */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Spawn {
  id: string;
  /** Feet position (bottom-centre of the collision box). */
  x: number;
  y: number;
  facing: Facing;
}

/** Walking into it updates the checkpoint (resume point on refresh). */
export interface Zone {
  id: string;
  rect: Rect;
  /** Spawn used when the game resumes with this zone as checkpoint. */
  spawn: string;
}

export interface Interactable {
  id: string;
  /** Area the player must face (frontal interaction). */
  rect: Rect;
  /** Dialogue script id (see `src/game/content/dialogue/muralla.ts`). */
  script: string;
  /** Short label for debug / accessibility. */
  label: string;
}

/**
 * Something drawn in the world, y-sorted by `baseY`. `x`/`y` is the sprite's
 * ground anchor (from the art manifest), not its top-left corner.
 */
export interface Prop {
  id: string;
  sprite: string;
  x: number;
  y: number;
  /** y used for depth sorting; defaults to the anchor `y`. */
  baseY?: number;
  /** Frame period for animated sprites (ms). */
  animMs?: number;
}

export interface NpcDef {
  id: string;
  sprite: string;
  /** Feet position. */
  x: number;
  y: number;
  facing: Facing;
}

export interface WorldMap {
  id: string;
  /** Visible name (UI banner). */
  displayName: string;
  timeOfDay: 'morning' | 'afternoon' | 'sunset' | 'night';
  /** Pre-rendered ground/façade image (art manifest sprite id). */
  background: string;
  widthTiles: number;
  heightTiles: number;
  /** One string per row, one char per tile (see the map's tile legend). */
  tiles: readonly string[];
  /** Tile chars that block movement. */
  solidTiles: string;
  /** Extra solid rectangles (props, facades, invisible borders). */
  colliders: readonly Rect[];
  props: readonly Prop[];
  npcs: readonly NpcDef[];
  interactables: readonly Interactable[];
  zones: readonly Zone[];
  spawns: readonly Spawn[];
  defaultSpawn: string;
}
