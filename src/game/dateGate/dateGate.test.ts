import { describe, expect, it } from 'vitest';
import { storyScene } from '../boss/story';
import {
  DATE_OPTIONS,
  gameInstant,
  getAvailableDateOptions,
  getDateRoutes,
  isDateOptionAvailable,
  MAIN_QUEST_ALREADY_ACTIVE,
  type DateOptionId,
} from '../calendar';
import { gameReducer } from '../state/gameReducer';
import { createInitialSave } from '../state/newGame';
import { SAVE_VERSION, type GameSave } from '../state/types';
import { chosenRouteLabel, DATE_GATE_COPY, dateGates, humanLabel } from './routes';

const T0 = '2026-09-28T09:00:00.000Z';
const madrid = (key: string, hour = 12, minute = 0) => gameInstant(key, hour, minute);
const available = (now: Date) => getAvailableDateOptions(now).map((o) => o.id);

describe('GAME-08 availability (Europe/Madrid)', () => {
  it('launch day: Wed, Thu and Sun available', () => {
    expect(available(madrid('2026-09-28'))).toEqual(['wed-30-sep', 'thu-01-oct', 'sun-04-oct']);
  });

  it('a route stays available through its whole Madrid day', () => {
    expect(isDateOptionAvailable('wed-30-sep', madrid('2026-09-30', 0, 0))).toBe(true);
    expect(isDateOptionAvailable('wed-30-sep', madrid('2026-09-30', 23, 59))).toBe(true);
    expect(isDateOptionAvailable('wed-30-sep', madrid('2026-10-01', 0, 0))).toBe(false);
  });

  it('Oct 1: Wed elapsed, Thu and Sun available', () => {
    expect(available(madrid('2026-10-01'))).toEqual(['thu-01-oct', 'sun-04-oct']);
  });

  it('Oct 2: only Sun; Oct 4: Sun that day; Oct 5: nothing', () => {
    expect(available(madrid('2026-10-02'))).toEqual(['sun-04-oct']);
    expect(available(madrid('2026-10-04', 22))).toEqual(['sun-04-oct']);
    expect(available(madrid('2026-10-05', 0, 1))).toEqual([]);
    expect(getDateRoutes(madrid('2026-10-05')).every((r) => r.status === 'elapsed')).toBe(true);
  });

  it('device timezone does not matter: 23:30 UTC on Sep 30 is already Oct 1 in Madrid', () => {
    const now = new Date('2026-09-30T23:30:00.000Z');
    expect(isDateOptionAvailable('wed-30-sep', now)).toBe(false);
    expect(isDateOptionAvailable('thu-01-oct', now)).toBe(true);
  });
});

describe('GAME-08 gates', () => {
  const gates = dateGates(madrid('2026-09-28'));

  it('four gates in calendar order, Friday once and never selectable', () => {
    expect(gates.map((g) => g.label)).toEqual([
      'WED · 30 SEP',
      'THU · 01 OCT',
      'FRI · 02 OCT',
      'SUN · 04 OCT',
    ]);
    const friday = gates.filter((g) => g.kind === 'mainQuest');
    expect(friday).toEqual([
      {
        kind: 'mainQuest',
        label: 'FRI · 02 OCT',
        sub: 'MAIN QUEST ALREADY ACTIVE',
        time: '18:30 · THEATRE',
      },
    ]);
    expect(MAIN_QUEST_ALREADY_ACTIVE.selectable).toBe(false);
    for (const hour of [0, 12, 23]) {
      expect(isDateOptionAvailable('fri-02-oct' as DateOptionId, madrid('2026-10-02', hour))).toBe(
        false,
      );
    }
  });

  it('routes come from the canonical options only', () => {
    const ids = gates.flatMap((g) => (g.kind === 'route' ? [g.id] : []));
    expect(ids).toEqual(DATE_OPTIONS.map((o) => o.id));
  });

  it('human-readable labels', () => {
    expect(humanLabel('2026-10-01')).toBe('Thursday · 1 October');
    expect(chosenRouteLabel('wed-30-sep')).toBe('WEDNESDAY · 30 SEPTEMBER');
    expect(chosenRouteLabel('thu-01-oct')).toBe('THURSDAY · 01 OCTOBER');
    expect(chosenRouteLabel('sun-04-oct')).toBe('SUNDAY · 04 OCTOBER');
  });

  it('copy stays restrained', () => {
    const text = Object.values(DATE_GATE_COPY).join(' ').toLowerCase();
    for (const bad of ['date with me', 'love', 'forever', 'destino', 'soulmate']) {
      expect(text).not.toContain(bad);
    }
  });
});

describe('GAME-08 save', () => {
  const fresh = (): GameSave => createInitialSave(new Date(T0));
  const choose = (s: GameSave, option: DateOptionId, at = '2026-09-28T10:00:00.000Z') =>
    gameReducer(s, { type: 'date/choose', option, at });

  it('first confirmed choice is stored with its time', () => {
    const s = choose(fresh(), 'thu-01-oct');
    expect(s.dateQuest).toEqual({
      chosenOptionId: 'thu-01-oct',
      chosenAt: '2026-09-28T10:00:00.000Z',
    });
    expect(s.timestamps.updatedAt).toBe('2026-09-28T10:00:00.000Z');
    expect(s.version).toBe(SAVE_VERSION);
  });

  it('never overwrites (same or different id); timestamps untouched', () => {
    const s = choose(fresh(), 'thu-01-oct');
    expect(choose(s, 'thu-01-oct', '2026-09-29T00:00:00.000Z')).toBe(s);
    expect(choose(s, 'sun-04-oct', '2026-09-29T00:00:00.000Z')).toBe(s);
  });

  it('rejects ids outside the canonical options', () => {
    const s = fresh();
    expect(choose(s, 'fri-02-oct' as DateOptionId)).toBe(s);
  });

  it('routing: a chosen route goes to the ending, a completed save to the slot', () => {
    const s = choose(fresh(), 'sun-04-oct');
    expect(storyScene(s)).toBe('ending');
    const done = gameReducer(s, { type: 'game/complete', at: '2026-09-28T10:05:00.000Z' });
    expect(storyScene(done)).toBe('saveSlot');
  });
});
