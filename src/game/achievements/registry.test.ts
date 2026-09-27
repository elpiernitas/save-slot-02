import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_IDS, achievementDefinition } from './registry';

describe('achievement registry', () => {
  it('contains only the three lightweight expansion toasts', () => {
    expect(Object.keys(ACHIEVEMENT_IDS)).toHaveLength(3);
    expect(achievementDefinition(ACHIEVEMENT_IDS.firstSync)?.title).toBe('FIRST SYNC');
    expect(achievementDefinition(ACHIEVEMENT_IDS.signalFound)?.title).toBe('SEÑAL ENCONTRADA');
    expect(achievementDefinition(ACHIEVEMENT_IDS.playerTwoOnline)?.title).toBe('PLAYER 2 ONLINE');
  });
});
