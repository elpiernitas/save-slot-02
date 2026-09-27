import { describe, expect, it } from 'vitest';
import type { DateOptionId } from '../calendar';
import { continueTarget } from '../scenes/flow';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import type { GameSave } from '../state/types';
import { ENDING_BEATS, ENDING_COPY, saveSlotRows } from './ending';
import { postgameStatus } from './postgame';

const at = (m: number) => `2026-09-28T10:${String(m).padStart(2, '0')}:00.000Z`;

function chosen(option: DateOptionId): GameSave {
  let s = createInitialSave(new Date(at(0)));
  s = { ...s, player: { ...s.player, classId: 'tank' } };
  return gameReducer(s, { type: 'date/choose', option, at: at(2) });
}
const complete = (s: GameSave, m = 3) => gameReducer(s, { type: 'game/complete', at: at(m) });

describe('GAME-09 completion', () => {
  it('first completion wins and keeps the chosen route', () => {
    const s = complete(chosen('thu-01-oct'));
    expect(s.timestamps.completedAt).toBe(at(3));
    expect(s.dateQuest).toEqual({ chosenOptionId: 'thu-01-oct', chosenAt: at(2) });
    expect(complete(s, 9)).toBe(s);
  });

  it('cannot complete without a date route', () => {
    const s = createInitialSave(new Date(at(0)));
    expect(complete(s)).toBe(s);
  });

  it('CONTINUE after completion goes to the save slot; with a route but not complete, to the ending', () => {
    const s = chosen('sun-04-oct');
    expect(continueTarget(s)).toBe('ending');
    expect(continueTarget(complete(s))).toBe('saveSlot');
  });
});

describe('GAME-09 save slot', () => {
  it.each([
    ['wed-30-sep', 'MIÉRCOLES · 30 DE SEPTIEMBRE'],
    ['thu-01-oct', 'JUEVES · 1 DE OCTUBRE'],
    ['sun-04-oct', 'DOMINGO · 4 DE OCTUBRE'],
  ] as const)('%s → %s', (option, label) => {
    expect(saveSlotRows(complete(chosen(option)))).toEqual([
      { label: 'PLAYER 1', value: 'LUIS' },
      { label: 'CLASE', value: 'TANQUE' },
      { label: 'PLAYER 2', value: 'MANU' },
      { label: 'MISIÓN SECUNDARIA', value: 'COMPLETADA' },
      { label: 'RUTA', value: label },
    ]);
  });

  it('never shows a slot (or a null date) for an unfinished save', () => {
    expect(saveSlotRows(chosen('wed-30-sep'))).toBeNull();
    expect(saveSlotRows(createInitialSave(new Date(at(0))))).toBeNull();
  });
});

describe('GAME-09 ending', () => {
  it('stages the beats in order with one human line that waits for the player', () => {
    expect(ENDING_BEATS.map((b) => b.id)).toEqual([
      'saving',
      'complete',
      'party',
      'route',
      'updated',
    ]);
    expect(ENDING_BEATS.find((b) => b.id === 'party')!.ms).toBeNull();
    const total = ENDING_BEATS.reduce((n, b) => n + (b.ms ?? 4000), 0);
    expect(total).toBeGreaterThanOrEqual(8000);
    expect(total).toBeLessThanOrEqual(45000);
  });

  it('keeps the copy restrained', () => {
    const text = Object.values(ENDING_COPY).join(' ').toLowerCase();
    for (const bad of ['forever', 'soulmate', 'destiny', 'destino', 'you saved me', 'siempre']) {
      expect(text).not.toContain(bad);
    }
  });
});

describe('GAME-10 postgame status', () => {
  it.each([
    ['2026-09-28T12:00:00Z', 'future', 'PRÓXIMA MISIÓN — EN 2 DÍAS'],
    ['2026-09-29T12:00:00Z', 'tomorrow', 'PRÓXIMA MISIÓN — MAÑANA'],
    ['2026-09-30T12:00:00Z', 'today', 'RUTA ELEGIDA — HOY'],
    ['2026-10-01T12:00:00Z', 'after', 'RUTA FIJADA — EL GUARDADO CONTINÚA'],
  ] as const)('Madrid date %s → %s', (iso, phase, label) => {
    const save = chosen('wed-30-sep');
    const status = postgameStatus(complete(save), new Date(iso));
    expect(status.phase).toBe(phase);
    expect(status.label).toBe(label);
  });
});
