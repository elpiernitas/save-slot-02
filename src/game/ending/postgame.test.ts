import { describe, expect, it } from 'vitest';
import { gameInstant } from '../calendar';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import { postgameStatus, RANDY_UNLOCK } from './postgame';

describe('GAME-10 post-game (small)', () => {
  it('derives the route status from the Madrid day, never claiming the outcome', () => {
    const route = 'thu-01-oct' as const;
    expect(postgameStatus(route, gameInstant('2026-09-28', 17))).toEqual({
      label: 'PRÓXIMA MISIÓN',
      value: 'EN 3 DÍAS',
    });
    expect(postgameStatus(route, gameInstant('2026-09-30', 23, 59)).value).toBe('MAÑANA');
    expect(postgameStatus(route, gameInstant('2026-10-01', 0, 1))).toEqual({
      label: 'RUTA ELEGIDA',
      value: 'HOY',
    });
    const after = postgameStatus(route, gameInstant('2026-10-02', 9));
    expect(after.label).toBe('RUTA FIJADA');
    expect(after.value).not.toMatch(/COMPLETAD|ÉXITO/);
  });

  it('crosses the end of summer time (25 Oct) without breaking', () => {
    expect(postgameStatus('sun-04-oct', gameInstant('2026-10-26', 12)).label).toBe('RUTA FIJADA');
  });

  it('the Randy unlock is granted once (first grant wins)', () => {
    const at = '2026-09-28T17:00:00.000Z';
    const s1 = gameReducer(createInitialSave(new Date(at)), {
      type: 'unlock/grant',
      unlock: RANDY_UNLOCK,
      at,
    });
    const s2 = gameReducer(s1, {
      type: 'unlock/grant',
      unlock: RANDY_UNLOCK,
      at: '2026-12-01T00:00:00.000Z',
    });
    expect(s2).toBe(s1);
    expect(s1.unlocks[RANDY_UNLOCK]).toEqual({ unlockedAt: at });
  });
});
