import type { IsoTimestamp } from '../../types/common';
import type { CardCollectionState, CardId, InventoryState, ItemDefinition, ItemId } from './types';

/**
 * Pure inventory/card transitions (GAME_05_SPEC §4–§5). Each returns the same
 * object when nothing changes, so callers can skip saving no-ops.
 */

/** Adds up to `maxStack`; keeps the first acquisition time. */
export function giveItem(
  inventory: InventoryState,
  item: ItemDefinition,
  quantity: number,
  at: IsoTimestamp,
): InventoryState {
  const current = inventory.items[item.id];
  const have = current?.quantity ?? 0;
  const next = Math.min(item.maxStack, have + Math.max(0, Math.floor(quantity)));
  if (next === have) return inventory;
  return {
    items: {
      ...inventory.items,
      [item.id]: { quantity: next, acquiredAt: current?.acquiredAt ?? at },
    },
  };
}

/** Removes up to what is held; the record disappears at zero. Missing = no-op. */
export function takeItem(inventory: InventoryState, id: ItemId, quantity: number): InventoryState {
  const current = inventory.items[id];
  const amount = Math.max(0, Math.floor(quantity));
  if (!current || amount === 0) return inventory;
  const left = current.quantity - amount;
  const items = { ...inventory.items };
  if (left > 0) items[id] = { ...current, quantity: left };
  else delete items[id];
  return { items };
}

/** First acquisition only: V1 cards are unique (count kept for later). */
export function giveCard(
  cards: CardCollectionState,
  id: CardId,
  at: IsoTimestamp,
): CardCollectionState {
  if (Object.hasOwn(cards.owned, id)) return cards;
  return { owned: { ...cards.owned, [id]: { obtainedAt: at, count: 1, seen: false } } };
}

/** Clears the NEW badge once the card's detail has been opened. */
export function markCardSeen(cards: CardCollectionState, id: CardId): CardCollectionState {
  const card = Object.hasOwn(cards.owned, id) ? cards.owned[id] : undefined;
  if (!card || card.seen) return cards;
  return { owned: { ...cards.owned, [id]: { ...card, seen: true } } };
}
