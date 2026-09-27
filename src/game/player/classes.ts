/**
 * Player classes. They came from a real conversation between the players:
 * GUERRERO, TANQUE, CURADOR. Only these three exist (see WORLD_BIBLE §8).
 *
 * Classes never create three different games: they tint small dialogues,
 * contextual options, flavor text and alternative solutions. Main content
 * stays reachable with any class. No numeric stats (yet).
 */

/** Code ids (English); display names are Spanish. */
export const PLAYER_CLASS_IDS = ['warrior', 'tank', 'healer'] as const;
export type PlayerClassId = (typeof PLAYER_CLASS_IDS)[number];

/** Free-form tags future content can query (e.g. "has a direct solution"). */
export type ClassTrait = 'direct' | 'acts-first' | 'endures' | 'protects' | 'observes' | 'fixes';

/** Accent colour tokens from the world palette (WORLD_BIBLE §6). */
export type ClassAccent = 'coral' | 'stone' | 'coast';

export interface PlayerClassDefinition {
  id: PlayerClassId;
  /** Shown in menus and SYSTEM lines. */
  displayName: string;
  /** One line under the name on the selection card. */
  shortDescription: string;
  /** Detail panel text (fits 3 short lines). */
  longDescription: string;
  /** In-character quip shown on the card. */
  flavorLine: string;
  /** Id of the pixel sigil (`src/game/content/sigils.ts`). */
  sigil: string;
  accent: ClassAccent;
  /** Short labels shown as chips (Spanish, uppercase). */
  traitLabels: readonly string[];
  traits: readonly ClassTrait[];
}

export const PLAYER_CLASSES: Readonly<Record<PlayerClassId, PlayerClassDefinition>> = {
  warrior: {
    id: 'warrior',
    displayName: 'GUERRERO',
    shortDescription: 'Va de frente. Actúa primero.',
    longDescription:
      'Resuelve empujando la situación hacia delante. Si hay una puerta, la abre. Si hay una cola, averigua por qué no avanza.',
    flavorLine: '¿Y si simplemente... vamos?',
    sigil: 'warrior',
    accent: 'coral',
    traitLabels: ['DE FRENTE', 'SIN RODEOS'],
    traits: ['direct', 'acts-first'],
  },
  tank: {
    id: 'tank',
    displayName: 'TANQUE',
    shortDescription: 'Aguanta. Protege. Persevera.',
    longDescription:
      'Sigue en pie cuando los demás ya se han sentado. Casi cualquier problema se soluciona sobreviviendo el tiempo suficiente.',
    flavorLine: 'Tranquilos. Esto lo aguanto yo.',
    sigil: 'tank',
    accent: 'stone',
    traitLabels: ['RESISTE', 'PROTEGE'],
    traits: ['endures', 'protects'],
  },
  healer: {
    id: 'healer',
    displayName: 'CURADOR',
    shortDescription: 'Observa, ayuda y arregla.',
    longDescription:
      'Mantiene al grupo funcionando. Se da cuenta de lo que falla y suele acabar cuidando problemas que nadie le había pedido.',
    flavorLine: 'Vale, pero ¿alguien ha comido algo?',
    sigil: 'healer',
    accent: 'coast',
    traitLabels: ['OBSERVA', 'ARREGLA'],
    traits: ['observes', 'fixes'],
  },
};

/** Display order on the selection screen. */
export const PLAYER_CLASS_LIST: readonly PlayerClassDefinition[] = PLAYER_CLASS_IDS.map(
  (id) => PLAYER_CLASSES[id],
);

export function isPlayerClassId(value: unknown): value is PlayerClassId {
  return typeof value === 'string' && (PLAYER_CLASS_IDS as readonly string[]).includes(value);
}

export function getPlayerClass(id: PlayerClassId): PlayerClassDefinition {
  return PLAYER_CLASSES[id];
}

/** Helper for future content: `hasPlayerClass(save, 'tank')`. */
export function hasPlayerClass(
  save: { player: { classId: PlayerClassId | null } },
  id: PlayerClassId,
): boolean {
  return save.player.classId === id;
}
