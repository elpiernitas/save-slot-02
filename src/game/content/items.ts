import type { ItemDefinition, ItemId } from '../inventory/types';

/**
 * Item registry (GAME_05_SPEC §4, §9). Only items the game can actually
 * award live here. None in the La Muralla slice yet: the spec's candidates
 * (coaster, receipt, coast token, player slot) arrive with the content that
 * grants them.
 */
export const ITEMS: Readonly<Record<ItemId, ItemDefinition>> = {};

export function itemDefinition(id: ItemId): ItemDefinition | undefined {
  return Object.hasOwn(ITEMS, id) ? ITEMS[id] : undefined;
}
