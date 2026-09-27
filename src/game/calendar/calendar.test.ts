import { describe, expect, it } from 'vitest';
import {
  DATE_OPTIONS,
  daysUntil,
  gameInstant,
  getDateOption,
  isDateOptionId,
  isSelectableDateKey,
  isTimeGateOpen,
  LAUNCH_DATE,
  MAIN_QUEST_ALREADY_ACTIVE,
  todayKey,
} from './calendar';
import { getIsoWeekday } from '../../lib/time';

const at = (iso: string) => new Date(iso);

describe('project dates', () => {
  it('launches on Monday 28 Sep 2026', () => {
    expect(LAUNCH_DATE).toBe('2026-09-28');
    expect(getIsoWeekday(LAUNCH_DATE)).toBe(1);
  });

  it('offers exactly Wed 30 Sep, Thu 1 Oct and Sun 4 Oct', () => {
    expect(DATE_OPTIONS.map((o) => o.dateKey)).toEqual(['2026-09-30', '2026-10-01', '2026-10-04']);
    expect(DATE_OPTIONS.map((o) => getIsoWeekday(o.dateKey))).toEqual([3, 4, 7]);
  });

  it('never lets Friday (main quest already active) be selected', () => {
    expect(MAIN_QUEST_ALREADY_ACTIVE.dateKey).toBe('2026-10-02');
    expect(MAIN_QUEST_ALREADY_ACTIVE.selectable).toBe(false);
    expect(isSelectableDateKey('2026-10-02')).toBe(false);
    expect(isSelectableDateKey('2026-10-01')).toBe(true);
  });

  it('looks up options by id', () => {
    expect(getDateOption('thu-01-oct').dateKey).toBe('2026-10-01');
    expect(isDateOptionId('fri-02-oct')).toBe(false);
    // @ts-expect-error — invalid id on purpose
    expect(() => getDateOption('fri-02-oct')).toThrow(RangeError);
  });
});

describe('Madrid-relative helpers', () => {
  it('todayKey uses Madrid, not the device zone', () => {
    expect(todayKey(at('2026-09-27T22:15:00Z'))).toBe('2026-09-28');
  });

  it('daysUntil counts calendar days in Madrid', () => {
    expect(daysUntil('2026-09-30', at('2026-09-28T08:00:00Z'))).toBe(2);
    expect(daysUntil('2026-09-30', at('2026-09-29T22:30:00Z'))).toBe(0);
    expect(daysUntil('2026-09-30', at('2026-10-01T10:00:00Z'))).toBe(-1);
  });

  it('gameInstant converts Madrid wall time', () => {
    expect(gameInstant('2026-10-02', 18, 30).toISOString()).toBe('2026-10-02T16:30:00.000Z');
    expect(gameInstant('2026-10-02').toISOString()).toBe('2026-10-01T22:00:00.000Z');
  });
});

describe('time gates', () => {
  const noDate = { chosenDateKey: null };

  it('fromDate opens at the Madrid wall time', () => {
    const gate = { kind: 'fromDate', dateKey: '2026-09-28', hour: 9 } as const;
    expect(isTimeGateOpen(gate, { ...noDate, now: at('2026-09-28T06:59:59Z') })).toBe(false);
    expect(isTimeGateOpen(gate, { ...noDate, now: at('2026-09-28T07:00:00Z') })).toBe(true);
  });

  it('onDate is open only during that Madrid day', () => {
    const gate = { kind: 'onDate', dateKey: '2026-10-02' } as const;
    expect(isTimeGateOpen(gate, { ...noDate, now: at('2026-10-01T21:59:00Z') })).toBe(false);
    expect(isTimeGateOpen(gate, { ...noDate, now: at('2026-10-01T22:00:00Z') })).toBe(true);
    expect(isTimeGateOpen(gate, { ...noDate, now: at('2026-10-02T22:00:00Z') })).toBe(false);
  });

  it('relativeToChosenDate stays closed until a date is chosen', () => {
    const gate = { kind: 'relativeToChosenDate', offsetDays: -1, hour: 20 } as const;
    const now = at('2026-10-03T19:00:00Z'); // Sat 21:00 Madrid
    expect(isTimeGateOpen(gate, { now, chosenDateKey: null })).toBe(false);
    expect(isTimeGateOpen(gate, { now, chosenDateKey: '2026-10-04' })).toBe(true);
    expect(
      isTimeGateOpen(gate, { now: at('2026-10-03T17:00:00Z'), chosenDateKey: '2026-10-04' }),
    ).toBe(false);
  });

  it('hourWindow supports windows that wrap past midnight', () => {
    const night = { kind: 'hourWindow', fromHour: 23, toHour: 3 } as const;
    expect(isTimeGateOpen(night, { ...noDate, now: at('2026-09-28T22:30:00Z') })).toBe(true); // 00:30
    expect(isTimeGateOpen(night, { ...noDate, now: at('2026-09-28T10:00:00Z') })).toBe(false); // 12:00
    const day = { kind: 'hourWindow', fromHour: 9, toHour: 18 } as const;
    expect(isTimeGateOpen(day, { ...noDate, now: at('2026-09-28T10:00:00Z') })).toBe(true);
  });
});
