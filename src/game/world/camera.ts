import type { Vec2 } from './types';

/**
 * Camera top-left so the target is centred, clamped to the map, in whole
 * pixels (no sub-pixel shimmer on pixel art). Maps smaller than the view are
 * centred.
 */
export function cameraFor(
  target: Vec2,
  view: { w: number; h: number },
  map: { width: number; height: number },
): Vec2 {
  const axis = (t: number, viewSize: number, mapSize: number) =>
    mapSize <= viewSize
      ? Math.round((mapSize - viewSize) / 2)
      : Math.round(Math.min(Math.max(t - viewSize / 2, 0), mapSize - viewSize));
  return { x: axis(target.x, view.w, map.width), y: axis(target.y, view.h, map.height) };
}

/** Half-size of the dead zone around the view centre (world px). */
export const CAMERA_DEAD_ZONE = { x: 24, y: 16 } as const;
/** Fraction of the remaining distance covered per second (soft follow). */
export const CAMERA_FOLLOW_RATE = 6;

/**
 * Soft follow: the camera only moves when the target leaves a small dead zone
 * around the centre, then eases towards it. Result is clamped to the map and
 * rounded to whole pixels, like `cameraFor`.
 */
export function followCamera(
  current: Vec2,
  target: Vec2,
  view: { w: number; h: number },
  map: { width: number; height: number },
  dtMs: number,
): Vec2 {
  const t = Math.min(1, (CAMERA_FOLLOW_RATE * Math.max(0, dtMs)) / 1000);
  const axis = (cur: number, pos: number, viewSize: number, mapSize: number, dead: number) => {
    if (mapSize <= viewSize) return Math.round((mapSize - viewSize) / 2);
    const centred = pos - viewSize / 2;
    const offset = centred - cur;
    const wanted = Math.abs(offset) <= dead ? cur : centred - Math.sign(offset) * dead;
    // Clamp before easing so the camera still reaches the map edges.
    const goal = Math.min(Math.max(wanted, 0), mapSize - viewSize);
    if (goal === cur || t === 0) return cur;
    const next = Math.round(cur + (goal - cur) * t);
    // Always make at least one pixel of progress so the camera never stalls.
    if (next !== cur) return next;
    return Math.abs(goal - cur) <= 1 ? Math.round(goal) : cur + Math.sign(goal - cur);
  };
  return {
    x: axis(current.x, target.x, view.w, map.width, CAMERA_DEAD_ZONE.x),
    y: axis(current.y, target.y, view.h, map.height, CAMERA_DEAD_ZONE.y),
  };
}
