import type { AchievementDefinition, AchievementId } from './types';

/** The three authored toasts allowed by the expansion scope. */
export const ACHIEVEMENT_IDS = {
  firstSync: 'first-sync',
  signalFound: 'signal-found',
  playerTwoOnline: 'player-2-online',
} as const;

export const ACHIEVEMENTS = {
  [ACHIEVEMENT_IDS.firstSync]: {
    id: ACHIEVEMENT_IDS.firstSync,
    title: 'FIRST SYNC',
    description: 'La ruta empieza a responder.',
    hidden: false,
  },
  [ACHIEVEMENT_IDS.signalFound]: {
    id: ACHIEVEMENT_IDS.signalFound,
    title: 'SEÑAL ENCONTRADA',
    description: 'La gaviota ha dejado de fingir que no sabe nada.',
    hidden: false,
  },
  [ACHIEVEMENT_IDS.playerTwoOnline]: {
    id: ACHIEVEMENT_IDS.playerTwoOnline,
    title: 'PLAYER 2 ONLINE',
    description: 'La puerta reconoce una segunda señal.',
    hidden: false,
  },
} as const satisfies Record<string, AchievementDefinition>;

export type KnownAchievementId = (typeof ACHIEVEMENT_IDS)[keyof typeof ACHIEVEMENT_IDS];

export function achievementDefinition(id: AchievementId): AchievementDefinition | undefined {
  return Object.hasOwn(ACHIEVEMENTS, id) ? ACHIEVEMENTS[id as KnownAchievementId] : undefined;
}
