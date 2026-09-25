import { describe, expect, it } from 'vitest';
import { createFixedClock } from './clock';
import {
  addDays,
  calendarDaysBetween,
  getIsoWeekday,
  getTimeZoneOffsetMs,
  isDateKey,
  parseDateKey,
  startOfDay,
  toDateKey,
  toWallTime,
  wallTimeToInstant,
} from './zonedTime';

const MADRID = 'Europe/Madrid';
const HOUR = 3_600_000;

describe('test environment', () => {
  it('does not run in Madrid, so Madrid logic cannot pass by accident', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).not.toBe(MADRID);
  });
});

describe('toWallTime / toDateKey', () => {
  it('reads Madrid summer time (UTC+2)', () => {
    expect(toWallTime(new Date('2026-09-28T07:30:00Z'), MADRID)).toEqual({
      year: 2026,
      month: 9,
      day: 28,
      hour: 9,
      minute: 30,
      second: 0,
    });
  });

  it('rolls the calendar day at Madrid midnight, not UTC midnight', () => {
    // 22:30 UTC on the 29th is already 00:30 on the 30th in Madrid.
    expect(toDateKey(new Date('2026-09-29T22:30:00Z'), MADRID)).toBe('2026-09-30');
    expect(toDateKey(new Date('2026-09-29T21:59:59Z'), MADRID)).toBe('2026-09-29');
  });

  it('returns hour 0 (never 24) at midnight', () => {
    expect(toWallTime(new Date('2026-09-29T22:00:00Z'), MADRID).hour).toBe(0);
  });

  it('rejects invalid dates', () => {
    expect(() => toWallTime(new Date('nope'), MADRID)).toThrow(RangeError);
  });
});

describe('offsets and wall time → instant', () => {
  it('knows Madrid offsets in summer and winter', () => {
    expect(getTimeZoneOffsetMs(new Date('2026-10-01T12:00:00Z'), MADRID)).toBe(2 * HOUR);
    expect(getTimeZoneOffsetMs(new Date('2026-12-01T12:00:00Z'), MADRID)).toBe(1 * HOUR);
  });

  it('converts a Madrid wall time to the right instant', () => {
    expect(
      wallTimeToInstant(
        { year: 2026, month: 10, day: 2, hour: 18, minute: 30 },
        MADRID,
      ).toISOString(),
    ).toBe('2026-10-02T16:30:00.000Z');
  });

  it('handles the October DST switch (ambiguous 02:30 → earlier instant)', () => {
    // 2026-10-25 03:00 CEST → 02:00 CET, so 02:30 happens twice.
    const instant = wallTimeToInstant(
      { year: 2026, month: 10, day: 25, hour: 2, minute: 30 },
      MADRID,
    );
    expect(instant.toISOString()).toBe('2026-10-25T00:30:00.000Z');
  });

  it('handles the March DST gap (02:30 does not exist)', () => {
    const instant = wallTimeToInstant(
      { year: 2026, month: 3, day: 29, hour: 2, minute: 30 },
      MADRID,
    );
    const wall = toWallTime(instant, MADRID);
    expect(wall.hour).toBe(3);
  });

  it('startOfDay is Madrid midnight', () => {
    expect(startOfDay('2026-09-30', MADRID).toISOString()).toBe('2026-09-29T22:00:00.000Z');
  });
});

describe('DateKey helpers', () => {
  it('validates keys', () => {
    expect(isDateKey('2026-09-30')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('2026-9-30')).toBe(false);
    expect(isDateKey(20260930)).toBe(false);
    expect(() => parseDateKey('tomorrow')).toThrow(RangeError);
  });

  it('computes weekdays of the project dates', () => {
    expect(getIsoWeekday('2026-09-28')).toBe(1); // Monday
    expect(getIsoWeekday('2026-09-30')).toBe(3); // Wednesday
    expect(getIsoWeekday('2026-10-01')).toBe(4); // Thursday
    expect(getIsoWeekday('2026-10-02')).toBe(5); // Friday
    expect(getIsoWeekday('2026-10-04')).toBe(7); // Sunday
  });

  it('adds days across month boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('counts calendar days, including across DST', () => {
    expect(calendarDaysBetween('2026-09-28', '2026-10-04')).toBe(6);
    expect(calendarDaysBetween('2026-10-04', '2026-09-28')).toBe(-6);
    expect(calendarDaysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});

describe('clock', () => {
  it('fixed clock always returns the same instant (as a fresh Date)', () => {
    const clock = createFixedClock('2026-09-28T10:00:00Z');
    const a = clock.now();
    a.setFullYear(1999);
    expect(clock.now().toISOString()).toBe('2026-09-28T10:00:00.000Z');
  });

  it('rejects invalid instants', () => {
    expect(() => createFixedClock('not a date')).toThrow(RangeError);
  });
});
