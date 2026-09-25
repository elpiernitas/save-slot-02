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
