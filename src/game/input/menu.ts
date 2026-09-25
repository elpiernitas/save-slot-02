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
