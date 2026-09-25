import type { IsoTimestamp } from '../../types/common';

export type ItemId = string;
export type CardId = string;

export type ItemCategory = 'key' | 'consumable' | 'lore' | 'equipment';

/** Static definition of an item (content, not save data). Defined in GAME-05. */
export interface ItemDefinition {
  id: ItemId;
  name: string;
  description: string;
  category: ItemCategory;
  /** Max quantity; 1 = unique item. */
  maxStack: number;
  /** Key into the future sprite atlas. */
  icon?: string;
}

export interface InventoryEntry {
  quantity: number;
  acquiredAt: IsoTimestamp;
}

/** Save-side inventory. Records keep it JSON-friendly. */
export interface InventoryState {
  items: Record<ItemId, InventoryEntry>;
}

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'holo' | 'secret';

/** Original collectible cards (no third-party IP). Defined in GAME-05. */
export interface CardDefinition {
  id: CardId;
  name: string;
  rarity: CardRarity;
  flavorText: string;
  art?: string;
}

export interface OwnedCard {
  obtainedAt: IsoTimestamp;
  count: number;
  /** Shown with a "NEW" badge until the player opens the binder. */
  seen: boolean;
}

export interface CardCollectionState {
  owned: Record<CardId, OwnedCard>;
}
