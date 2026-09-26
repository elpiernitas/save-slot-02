import type { CardDefinition, CardId } from '../inventory/types';

/**
 * CITY CARDS registry (CITY_CARDS_BIBLE). Only cards the game can actually
 * award live here; later sets are added with the content that grants them.
 * Illustrations are windows onto ENV-001, ChatGPT's approved La Muralla art.
 */
export const CARDS = {
  'city.001.la_muralla': {
    id: 'city.001.la_muralla',
    number: '001',
    name: 'LA MURALLA',
    kind: 'place',
    rarity: 'uncommon',
    flavorText: 'Side quest detected. Context unavailable.',
    art: { sprite: 'background', x: 0, y: 30, w: 320, h: 240 },
  },
  'city.002.bollard': {
    id: 'city.002.bollard',
    number: '002',
    name: 'BOLLARD Lv. ???',
    kind: 'object',
    rarity: 'common',
    flavorText: 'Unmoved. Unbothered. Probably load-bearing.',
    art: { sprite: 'background', x: 503, y: 272, w: 80, h: 60 },
  },
  'city.005.cimavilla_afternoon': {
    id: 'city.005.cimavilla_afternoon',
    number: '005',
    name: 'AFTERNOON IN CIMAVILLA',
    kind: 'event',
    rarity: 'holo',
    flavorText: 'The city is doing absolutely nothing dramatic.',
    art: { sprite: 'background', x: 200, y: 40, w: 480, h: 360 },
  },
} as const satisfies Record<CardId, CardDefinition>;

export type KnownCardId = keyof typeof CARDS;

const ALL: Readonly<Record<CardId, CardDefinition>> = CARDS;

export function cardDefinition(id: CardId): CardDefinition | undefined {
  return Object.hasOwn(ALL, id) ? ALL[id] : undefined;
}

/** Binder order: catalogue number, secrets last. */
export function cardOrder(a: CardDefinition, b: CardDefinition): number {
  return a.number.localeCompare(b.number, 'en', { numeric: true });
}
