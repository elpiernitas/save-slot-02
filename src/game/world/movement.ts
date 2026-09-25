import type { CollisionWorld } from './collision';
import type { Facing, Rect, Vec2 } from './types';

/** Walking speed in world px per second (~5 tiles/s): steady, never slippery. */
export const WALK_SPEED = 80;
/** Frame deltas are clamped so a background tab can't teleport the player. */
export const MAX_STEP_MS = 50;

/** Player collision box: the feet, not the whole sprite (walk "behind" things). */
export const FEET = { w: 16, h: 6 } as const;

export function feetRect(pos: Vec2): Rect {
  return { x: pos.x - FEET.w / 2, y: pos.y - FEET.h, w: FEET.w, h: FEET.h };
}

const DELTA: Record<Facing, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface MoveResult {
  pos: Vec2;
  facing: Facing;
  moving: boolean;
}

/**
 * One movement step. 4 directions only (the latest held key wins), constant
 * speed, no acceleration. Blocked moves slide back to the last free
 * position pixel by pixel so the player stops flush against walls.
 */
export function stepMovement(
  pos: Vec2,
  facing: Facing,
  direction: Facing | null,
  dtMs: number,
  world: CollisionWorld,
): MoveResult {
  if (!direction) return { pos, facing, moving: false };
  const dist = (WALK_SPEED * Math.min(dtMs, MAX_STEP_MS)) / 1000;
  const d = DELTA[direction];
  let next = { x: pos.x + d.x * dist, y: pos.y + d.y * dist };

  if (world.isBlocked(feetRect(next))) {
    // Approach the obstacle in small increments.
    next = pos;
    const steps = Math.ceil(dist);
    for (let i = 1; i <= steps; i++) {
      const step = Math.min(i, dist);
      const candidate = { x: pos.x + d.x * step, y: pos.y + d.y * step };
      if (world.isBlocked(feetRect(candidate))) break;
      next = candidate;
    }
  }
  const moved = next.x !== pos.x || next.y !== pos.y;
  return { pos: next, facing: direction, moving: moved };
}
