import { center, intersects } from './geometry';
import { feetRect } from './movement';
import type { Facing, Interactable, Rect, Vec2, Zone } from './types';

/** How far in front of the feet the player can reach. */
export const REACH = 12;

/** The area in front of the player that selects an interactable. */
export function probeRect(pos: Vec2, facing: Facing): Rect {
  const feet = feetRect(pos);
  switch (facing) {
    case 'up':
      return { x: feet.x, y: feet.y - REACH, w: feet.w, h: REACH };
    case 'down':
      return { x: feet.x, y: feet.y + feet.h, w: feet.w, h: REACH };
    case 'left':
      return { x: feet.x - REACH, y: feet.y - 2, w: REACH, h: feet.h + 4 };
    case 'right':
      return { x: feet.x + feet.w, y: feet.y - 2, w: REACH, h: feet.h + 4 };
  }
}

/**
 * Frontal interaction: the interactable the player is facing, nearest first.
 * Returns null when nothing is in front (no prompt is shown).
 */
export function findInteraction(
  pos: Vec2,
  facing: Facing,
  interactables: readonly Interactable[],
): Interactable | null {
  const probe = probeRect(pos, facing);
  const probeCenter = center(probe);
  let best: Interactable | null = null;
  let bestDist = Infinity;
  for (const item of interactables) {
    if (!intersects(probe, item.rect)) continue;
    const c = center(item.rect);
    const dist = Math.hypot(c.x - probeCenter.x, c.y - probeCenter.y);
    if (dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }
  return best;
}

/** The zone the player's feet are in (first match), or null. */
export function zoneAt(pos: Vec2, zones: readonly Zone[]): Zone | null {
  const feet = feetRect(pos);
  return zones.find((z) => intersects(feet, z.rect)) ?? null;
}
