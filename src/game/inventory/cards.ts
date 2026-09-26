import { cardDefinition, cardOrder } from '../content/cards';
import { itemDefinition } from '../content/items';
import type { GameSave } from '../state/types';
import type { CardDefinition, CardId, ItemDefinition, ItemId, OwnedCard } from './types';

export interface BinderEntry {
  card: CardDefinition;
  owned: OwnedCard;
}

/**
 * Cards shown in the binder: owned ones only, by catalogue number. No empty
 * slots or "3/100" counter (GAME_05_SPEC §13): secrets and unknown cards
 * simply do not appear.
 */
export function binderEntries(save: GameSave): BinderEntry[] {
  return Object.entries(save.cards.owned)
    .flatMap(([id, owned]) => {
      const card = cardDefinition(id);
      return card ? [{ card, owned }] : [];
    })
    .sort((a, b) => cardOrder(a.card, b.card));
}

export interface InventoryRow {
  item: ItemDefinition;
  quantity: number;
}

/** Held items that the registry knows, in acquisition order. */
export function inventoryRows(save: GameSave): InventoryRow[] {
  return Object.entries(save.inventory.items)
    .flatMap(([id, entry]) => {
      const item = itemDefinition(id);
      return item ? [{ item, quantity: entry.quantity, at: entry.acquiredAt }] : [];
    })
    .sort((a, b) => a.at.localeCompare(b.at))
    .map(({ item, quantity }) => ({ item, quantity }));
}

export type Acquisition =
  { kind: 'card'; card: CardDefinition } | { kind: 'item'; item: ItemDefinition };

/** What was gained between two saves (e.g. before/after a dialogue), cards first. */
export function newAcquisitions(before: GameSave, after: GameSave): Acquisition[] {
  const cards = Object.keys(after.cards.owned)
    .filter((id: CardId) => !Object.hasOwn(before.cards.owned, id))
    .flatMap((id) => {
      const card = cardDefinition(id);
      return card ? [{ kind: 'card' as const, card }] : [];
    });
  const items = Object.keys(after.inventory.items)
    .filter((id: ItemId) => !Object.hasOwn(before.inventory.items, id))
    .flatMap((id) => {
      const item = itemDefinition(id);
      return item ? [{ kind: 'item' as const, item }] : [];
    });
  return [...cards, ...items];
}
