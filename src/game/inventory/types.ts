import type { IsoTimestamp } from '../../types/common';

export type ItemId = string;
export type CardId = string;

/**
 * quest: story/mechanic state as an object (unique) · object: ordinary world
 * thing · consumable: stackable only when a puzzle uses quantity · key: access.
 * No equipment or stats (GAME_05_SPEC §4).
 */
export type ItemCategory = 'quest' | 'object' | 'consumable' | 'key';

/** Static definition of an item (content, not save data). */
export interface ItemDefinition {
  id: ItemId;
  name: string;
  description: string;
  category: ItemCategory;
  /** Max quantity; 1 = unique item. */
  maxStack: number;
  /** Art manifest sprite id for the icon; absent = text-only placeholder. */
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

/** A rectangle of an art-manifest sprite used as a card illustration (no new art). */
export interface CardArt {
  sprite: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CityCardKind = 'place' | 'object' | 'npc' | 'event' | 'system';

/**
 * CITY CARD: original collectible record (CITY_CARDS_BIBLE). Rarity is visual
 * flavour only: no stats, power, value or deck mechanics.
 */
export interface CardDefinition {
  id: CardId;
  /** Catalogue number shown on the card ("001", or "???" for secrets). */
  number: string;
  name: string;
  kind: CityCardKind;
  rarity: CardRarity;
  /** One line on the card face. */
  flavorText: string;
  /** Optional 1–3 sentences for the detail view. */
  description?: string;
  /** Illustration: a window onto approved world art; absent = placeholder frame. */
  art?: CardArt;
  /** Secret/system cards never appear in the binder before they are owned. */
  hiddenUntilOwned?: boolean;
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
