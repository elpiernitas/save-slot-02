import type { DateKey } from '../../types/common';

/**
 * Time-zone aware helpers built only on `Intl.DateTimeFormat` (no library).
 *
 * Vocabulary:
 * - An *instant* is a JS `Date` (absolute point in time, UTC internally).
 * - A *wall time* is what a clock on the wall in `timeZone` shows.
 * - A `DateKey` (`YYYY-MM-DD`) is a calendar day.
 *
 * Game code should not call these directly for game rules; use
 * `src/game/calendar`, which pins the time zone to Europe/Madrid.
 */

export interface CalendarDate {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
}

export interface WallTime extends CalendarDate {
  /** 0–23 */
  hour: number;
  minute: number;
  second: number;
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const MS_PER_DAY = 86_400_000;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Wall-clock reading of `instant` in `timeZone`. */
export function toWallTime(instant: Date, timeZone: string): WallTime {
  if (Number.isNaN(instant.getTime())) {
    throw new RangeError('Invalid Date passed to toWallTime');
  }
  const parts = getFormatter(timeZone).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    if (!part) throw new Error(`Missing "${type}" in formatted date`);
    return Number(part.value);
  };
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    // Some engines still emit "24" at midnight even with h23.
    hour: read('hour') % 24,
    minute: read('minute'),
    second: read('second'),
  };
}

/** Offset of `timeZone` from UTC at `instant`, in ms (Madrid summer time = +7_200_000). */
export function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const wall = toWallTime(instant, timeZone);
  const wallAsUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );
  const instantWithoutMs = Math.floor(instant.getTime() / 1000) * 1000;
  return wallAsUtc - instantWithoutMs;
}

/**
 * Converts a wall time in `timeZone` to an absolute instant.
 *
 * DST edge cases: a non-existent wall time (spring-forward gap) resolves to
 * an instant after the gap; an ambiguous one (fall-back overlap) resolves to
 * the earlier instant. None of the project dates fall on a transition.
 */
export function wallTimeToInstant(
  wall: CalendarDate & Partial<Pick<WallTime, 'hour' | 'minute' | 'second'>>,
  timeZone: string,
): Date {
  const { year, month, day, hour = 0, minute = 0, second = 0 } = wall;
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);

  // Time zones change offset at most once around a given day, so the offsets
  // one day before and after give every possible candidate instant.
  const offsetBefore = getTimeZoneOffsetMs(new Date(asUtc - MS_PER_DAY), timeZone);
  const offsetAfter = getTimeZoneOffsetMs(new Date(asUtc + MS_PER_DAY), timeZone);
  const candidates = [asUtc - offsetBefore, asUtc - offsetAfter].filter((ms) => {
    const w = toWallTime(new Date(ms), timeZone);
    return (
      w.year === year &&
      w.month === month &&
      w.day === day &&
      w.hour === hour &&
      w.minute === minute &&
      w.second === second
    );
  });

  // Ambiguous (fall back) → earliest match. Gap (spring forward) → no match:
  // applying the pre-transition offset lands just after the gap.
  return new Date(candidates.length > 0 ? Math.min(...candidates) : asUtc - offsetBefore);
}

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string') return false;
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

export function parseDateKey(key: DateKey): CalendarDate {
  if (!isDateKey(key)) throw new RangeError(`Invalid DateKey: ${key}`);
  const [year = 0, month = 0, day = 0] = key.split('-').map(Number);
  return { year, month, day };
}

export function formatDateKey({ year, month, day }: CalendarDate): DateKey {
  const pad = (n: number, width: number) => String(n).padStart(width, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/** Calendar day that `instant` falls on in `timeZone`. */
export function toDateKey(instant: Date, timeZone: string): DateKey {
  return formatDateKey(toWallTime(instant, timeZone));
}

/** Weekday of a calendar date (independent of any time zone). */
export function getIsoWeekday(key: DateKey): IsoWeekday {
  const { year, month, day } = parseDateKey(key);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday
  return (jsDay === 0 ? 7 : jsDay) as IsoWeekday;
}

export function addDays(key: DateKey, days: number): DateKey {
  const { year, month, day } = parseDateKey(key);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateKey({
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  });
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). DST-proof. */
export function calendarDaysBetween(from: DateKey, to: DateKey): number {
  const a = parseDateKey(from);
  const b = parseDateKey(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / MS_PER_DAY,
  );
}

/** Instant at which calendar day `key` starts (00:00) in `timeZone`. */
export function startOfDay(key: DateKey, timeZone: string): Date {
  return wallTimeToInstant(parseDateKey(key), timeZone);
}
