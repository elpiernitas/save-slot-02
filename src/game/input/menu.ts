/** Pure menu navigation. Rendering and input wiring live in `useMenu`. */
export interface MenuItemLike {
  disabled?: boolean;
}

export function firstEnabledIndex(items: readonly MenuItemLike[]): number {
  const index = items.findIndex((item) => !item.disabled);
  return index === -1 ? 0 : index;
}

/**
 * Moves the selection by `delta` (±1), skipping disabled items.
 * Wraps around by default, like most RPG menus.
 */
export function moveSelection(
  items: readonly MenuItemLike[],
  current: number,
  delta: 1 | -1,
  wrap = true,
): number {
  const count = items.length;
  if (count === 0) return 0;
  let index = current;
  for (let step = 0; step < count; step++) {
    const next = index + delta;
    if (!wrap && (next < 0 || next >= count)) return current;
    index = (next + count) % count;
    if (!items[index]?.disabled) return index;
  }
  return current;
}

/** Input ignored right after a mid-action menu opens (a dodge in flight). */
export const MENU_GUARD_MS = 350;

/**
 * Gate for menus that open mid-action (boss defeat, assist offer). Nothing
 * that belongs to the fight may move or confirm them:
 *  - for `guardMs` after opening, every input is ignored (a new direction
 *    pressed while dodging at the moment of the hit);
 *  - after that, a key still held from before only sends auto-repeats, which
 *    stay ignored until the first fresh (non-repeat) press. From then on,
 *    holding a key scrolls as usual.
 */
export function createFreshInputGate(guardMs = 0, now: () => number = () => performance.now()) {
  const openedAt = now();
  let open = false;
  return (repeat: boolean): boolean => {
    if (now() - openedAt < guardMs) return false;
    if (!repeat) open = true;
    return open;
  };
}
