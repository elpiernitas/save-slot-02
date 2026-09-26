import { describe, expect, it } from 'vitest';
import { CARDS, cardDefinition, cardOrder } from '../content/cards';
import { ITEMS } from '../content/items';
import { SPRITES } from '../world/art/assets';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import { SAVE_VERSION } from '../state/types';
import { binderEntries, inventoryRows, newAcquisitions } from './cards';
import { giveCard, giveItem, markCardSeen, takeItem } from './inventory';
import type { ItemDefinition } from './types';

const T1 = '2026-09-28T09:05:00.000Z';
const T2 = '2026-09-28T09:10:00.000Z';
const COASTER: ItemDefinition = {
  id: 'object.coaster',
  name: 'COASTER',
  description: 'A circular proof that at some point there was a drink here.',
  category: 'object',
  maxStack: 1,
};
const COINS: ItemDefinition = {
  ...COASTER,
  id: 'consumable.coin',
  maxStack: 3,
  category: 'consumable',
};
const empty = { items: {} };

describe('inventory (pure)', () => {
  it('gives a unique item once and ignores extra copies', () => {
    const once = giveItem(empty, COASTER, 1, T1);
    expect(once.items['object.coaster']).toEqual({ quantity: 1, acquiredAt: T1 });
    expect(giveItem(once, COASTER, 1, T2)).toBe(once);
  });

  it('stacks up to maxStack and keeps the first acquisition time', () => {
    const a = giveItem(empty, COINS, 2, T1);
    const b = giveItem(a, COINS, 5, T2);
    expect(b.items['consumable.coin']).toEqual({ quantity: 3, acquiredAt: T1 });
  });

  it('takes items, removes the record at zero, and ignores missing ones', () => {
    const three = giveItem(empty, COINS, 3, T1);
    expect(takeItem(three, 'consumable.coin', 2).items['consumable.coin']?.quantity).toBe(1);
    expect(takeItem(three, 'consumable.coin', 9).items).toEqual({});
    expect(takeItem(three, 'nope', 1)).toBe(three);
    expect(takeItem(three, 'consumable.coin', -4)).toBe(three);
  });

  it('gives a card once (duplicates are no-ops) and marks it seen', () => {
    const first = giveCard({ owned: {} }, 'city.002.bollard', T1);
    expect(first.owned['city.002.bollard']).toEqual({ obtainedAt: T1, count: 1, seen: false });
    expect(giveCard(first, 'city.002.bollard', T2)).toBe(first);
    const seen = markCardSeen(first, 'city.002.bollard');
    expect(seen.owned['city.002.bollard']?.seen).toBe(true);
    expect(markCardSeen(seen, 'city.002.bollard')).toBe(seen);
    expect(markCardSeen(seen, 'missing')).toBe(seen);
  });
});

describe('inventory (reducer)', () => {
  const initial = createInitialSave(new Date('2026-09-28T09:00:00Z'));

  it('gives, keeps and marks cards through actions', () => {
    const got = gameReducer(initial, { type: 'card/give', card: 'city.001.la_muralla', at: T1 });
    expect(got.cards.owned['city.001.la_muralla']).toMatchObject({ seen: false, obtainedAt: T1 });
    expect(got.timestamps.updatedAt).toBe(T1);
    expect(gameReducer(got, { type: 'card/give', card: 'city.001.la_muralla', at: T2 })).toBe(got);
    const seen = gameReducer(got, { type: 'card/markSeen', card: 'city.001.la_muralla', at: T2 });
    expect(seen.cards.owned['city.001.la_muralla']?.seen).toBe(true);
  });

  it('ignores unknown item and card ids (content errors caught by tests)', () => {
    expect(gameReducer(initial, { type: 'item/give', item: 'nope', at: T1 })).toBe(initial);
    expect(gameReducer(initial, { type: 'card/give', card: 'nope', at: T1 })).toBe(initial);
    expect(gameReducer(initial, { type: 'item/take', item: 'nope', at: T1 })).toBe(initial);
  });

  it('does not change the save shape (no SAVE_VERSION bump)', () => {
    expect(SAVE_VERSION).toBe(2);
    expect(initial.inventory).toEqual({ items: {} });
    expect(initial.cards).toEqual({ owned: {} });
  });
});

describe('content registries', () => {
  it('cards: ids match keys, numbers are unique, copy is short and original', () => {
    const cards = Object.entries(CARDS);
    for (const [key, card] of cards) {
      expect(card.id).toBe(key);
      expect(card.flavorText.length).toBeLessThanOrEqual(60);
      expect(`${card.name} ${card.flavorText}`).not.toMatch(/pok[eé]mon|pikachu|\bHP\b|energy/i);
    }
    expect(new Set(cards.map(([, c]) => c.number)).size).toBe(cards.length);
    expect(cardDefinition('city.001.la_muralla')?.name).toBe('LA MURALLA');
    expect(cardDefinition('toString')).toBeUndefined();
    expect([...Object.values(CARDS)].sort(cardOrder).map((c) => c.number)).toEqual(['001', '002']);
  });

  it('card art is a window inside an existing approved sprite', () => {
    for (const card of Object.values(CARDS)) {
      const art = card.art;
      const sprite = SPRITES[art.sprite];
      expect(sprite?.status, card.id).toBe('final');
      expect(art.x + art.w, card.id).toBeLessThanOrEqual(sprite!.width);
      expect(art.y + art.h, card.id).toBeLessThanOrEqual(sprite!.height);
      expect(art.w / art.h, card.id).toBeCloseTo(4 / 3, 2);
    }
  });

  it('items: ids match keys and stacks are positive', () => {
    for (const [key, item] of Object.entries(ITEMS)) {
      expect(item.id).toBe(key);
      expect(item.maxStack).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('binder / acquisitions', () => {
  const base = createInitialSave(new Date('2026-09-28T09:00:00Z'));
  const withCards = [
    { type: 'card/give', card: 'city.002.bollard', at: T1 },
    { type: 'card/give', card: 'city.001.la_muralla', at: T2 },
  ] as const;
  const owned = withCards.reduce(gameReducer, base);

  it('lists owned cards by number, never unknown ones', () => {
    expect(binderEntries(base)).toEqual([]);
    expect(binderEntries(owned).map((e) => e.card.number)).toEqual(['001', '002']);
    const ghost = {
      ...owned,
      cards: { owned: { ...owned.cards.owned, ghost: { obtainedAt: T1, count: 1, seen: false } } },
    };
    expect(binderEntries(ghost)).toHaveLength(2);
  });

  it('reports what a dialogue added, and nothing for duplicates', () => {
    const one = gameReducer(base, withCards[0]);
    expect(newAcquisitions(base, one)).toEqual([{ kind: 'card', card: CARDS['city.002.bollard'] }]);
    expect(newAcquisitions(one, gameReducer(one, withCards[0]))).toEqual([]);
    expect(inventoryRows(owned)).toEqual([]);
  });
});
