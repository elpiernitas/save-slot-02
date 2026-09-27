import type { AchievementDefinition } from './types';

/**
 * Three light achievements (content expansion). Toasts only: no menu, no
 * grind. Names are the director's, kept verbatim.
 */
export const ACHIEVEMENTS = {
  first_sync: {
    id: 'first_sync',
    title: 'FIRST SYNC',
    description: 'Ruta de balizas sincronizada.',
    hidden: false,
  },
  signal_found: {
    id: 'signal_found',
    title: 'SEÑAL ENCONTRADA',
    description: 'Protocolo de la gaviota superado.',
    hidden: false,
  },
  player2_online: {
    id: 'player2_online',
    title: 'PLAYER 2 ONLINE',
    description: 'La puerta se abrió entre los dos.',
    hidden: false,
  },
} as const satisfies Record<string, AchievementDefinition>;

export type KnownAchievementId = keyof typeof ACHIEVEMENTS;

const ALL: Readonly<Record<string, AchievementDefinition>> = ACHIEVEMENTS;
export const achievementDefinition = (id: string) => (Object.hasOwn(ALL, id) ? ALL[id] : undefined);
