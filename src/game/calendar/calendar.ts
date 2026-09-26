import type { DateKey } from '../../types/common';
import {
  addDays,
  calendarDaysBetween,
  isDateKey,
  parseDateKey,
  toDateKey,
  toWallTime,
  wallTimeToInstant,
  type WallTime,
} from '../../lib/time';

/**
 * Single source of truth for every real-world date the game cares about.
 * All game rules evaluate time in Europe/Madrid, regardless of the device.
 * See docs/GAME_CONSTITUTION.md §Dates.
 */
export const GAME_TIME_ZONE = 'Europe/Madrid';

/** Monday: the day the game is sent to the player. */
export const LAUNCH_DATE: DateKey = '2026-09-28';

export type DateOptionId = 'wed-30-sep' | 'thu-01-oct' | 'sun-04-oct';

export interface DateOption {
  id: DateOptionId;
  dateKey: DateKey;
}

/** The only dates the player can pick for the secret date. Order = display order. */
export const DATE_OPTIONS: readonly DateOption[] = [
  { id: 'wed-30-sep', dateKey: '2026-09-30' },
  { id: 'thu-01-oct', dateKey: '2026-10-01' },
  { id: 'sun-04-oct', dateKey: '2026-10-04' },
];

/**
 * Friday already has a real plan (theatre at 18:30, maybe a party after).
 * It may appear in-game as "MAIN QUEST ALREADY ACTIVE" but is never selectable.
 */
export const MAIN_QUEST_ALREADY_ACTIVE = {
  dateKey: '2026-10-02',
  label: 'MAIN QUEST ALREADY ACTIVE',
  startsAt: { hour: 18, minute: 30 },
  selectable: false,
} as const;

export function nowInGameZone(now: Date): WallTime {
  return toWallTime(now, GAME_TIME_ZONE);
}

export function todayKey(now: Date): DateKey {
  return toDateKey(now, GAME_TIME_ZONE);
}

export function getDateOption(id: DateOptionId): DateOption {
  const option = DATE_OPTIONS.find((o) => o.id === id);
  if (!option) throw new RangeError(`Unknown date option: ${id}`);
  return option;
}

export function isDateOptionId(value: unknown): value is DateOptionId {
  return DATE_OPTIONS.some((o) => o.id === value);
}

/** True only for the three pickable dates. Friday and anything else → false. */
export function isSelectableDateKey(key: DateKey): boolean {
  return DATE_OPTIONS.some((o) => o.dateKey === key);
}

/** Calendar days from today (Madrid) to `target`. 0 = today, negative = past. */
export function daysUntil(target: DateKey, now: Date): number {
  return calendarDaysBetween(todayKey(now), target);
}

/** Instant for a Madrid wall time on `key` (defaults to 00:00). */
export function gameInstant(key: DateKey, hour = 0, minute = 0): Date {
  return wallTimeToInstant({ ...parseDateKey(key), hour, minute }, GAME_TIME_ZONE);
}

// ---------------------------------------------------------------------------
// Time gates: declarative, serialisable unlock rules for later phases
// (GAME-10 post-game unlocks, time-aware dialogue, etc.).
// ---------------------------------------------------------------------------

export type TimeGate =
  /** Open from a Madrid wall time on a fixed date onwards. */
  | { kind: 'fromDate'; dateKey: DateKey; hour?: number; minute?: number }
  /** Open only during a given Madrid calendar day. */
  | { kind: 'onDate'; dateKey: DateKey }
  /**
   * Relative to the date the player chose. `offsetDays` 0 = the date itself,
   * -1 = the day before, etc. Closed while no date has been chosen.
   */
  | { kind: 'relativeToChosenDate'; offsetDays: number; hour?: number; minute?: number }
  /** Open while the current Madrid hour is within [fromHour, toHour). Wraps past midnight. */
  | { kind: 'hourWindow'; fromHour: number; toHour: number };

export interface TimeContext {
  now: Date;
  chosenDateKey: DateKey | null;
}

export function isTimeGateOpen(gate: TimeGate, { now, chosenDateKey }: TimeContext): boolean {
  switch (gate.kind) {
    case 'fromDate':
      return now.getTime() >= gameInstant(gate.dateKey, gate.hour, gate.minute).getTime();
    case 'onDate':
      return todayKey(now) === gate.dateKey;
    case 'relativeToChosenDate': {
      if (!chosenDateKey || !isDateKey(chosenDateKey)) return false;
      const target = addDays(chosenDateKey, gate.offsetDays);
      return now.getTime() >= gameInstant(target, gate.hour, gate.minute).getTime();
    }
    case 'hourWindow': {
      const { hour } = nowInGameZone(now);
      return gate.fromHour <= gate.toHour
        ? hour >= gate.fromHour && hour < gate.toHour
        : hour >= gate.fromHour || hour < gate.toHour;
    }
  }
}

// ---------------------------------------------------------------------------
// GAME-08 date gate: what can still be chosen right now (Madrid calendar).
// ---------------------------------------------------------------------------

export type RouteStatus = 'available' | 'elapsed';

export interface DateRoute {
  option: DateOption;
  status: RouteStatus;
}

/**
 * Canonical options in display order with their availability. A date stays
 * selectable through its whole Madrid calendar day ("today" counts), and
 * becomes `elapsed` from the next day. Friday is never part of this list.
 */
export function getDateRoutes(now: Date): DateRoute[] {
  return DATE_OPTIONS.map((option) => ({
    option,
    status: daysUntil(option.dateKey, now) >= 0 ? 'available' : 'elapsed',
  }));
}

/** Only the options that can still be chosen. */
export function getAvailableDateOptions(now: Date): DateOption[] {
  return getDateRoutes(now)
    .filter((r) => r.status === 'available')
    .map((r) => r.option);
}

/** True when a given option may be chosen now (never Friday, never the past). */
export function isDateOptionAvailable(id: DateOptionId, now: Date): boolean {
  return getAvailableDateOptions(now).some((o) => o.id === id);
}
