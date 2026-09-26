/**
 * GAME-08 date gate: labels for the canonical routes (GAME_08_COPY). Every
 * date and weekday is derived from `src/game/calendar` — nothing here holds
 * a second copy of the dates.
 */
import {
  getDateOption,
  getDateRoutes,
  MAIN_QUEST_ALREADY_ACTIVE,
  type DateOptionId,
  type RouteStatus,
} from '../calendar';
import { getIsoWeekday, parseDateKey } from '../../lib/time';
import type { DateKey } from '../../types/common';

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

const pad = (n: number) => String(n).padStart(2, '0');
const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** `WED · 30 SEP` */
export function shortLabel(key: DateKey): string {
  const { day, month } = parseDateKey(key);
  const weekday = WEEKDAYS[getIsoWeekday(key) - 1]!;
  return `${weekday.slice(0, 3)} · ${pad(day)} ${MONTHS[month - 1]!.slice(0, 3)}`;
}

/** `Thursday · 1 October` (confirmation, human-readable). */
export function humanLabel(key: DateKey): string {
  const { day, month } = parseDateKey(key);
  return `${title(WEEKDAYS[getIsoWeekday(key) - 1]!)} · ${day} ${title(MONTHS[month - 1]!)}`;
}

/** `THURSDAY · 01 OCTOBER` (ending and save slot). */
export function longLabel(key: DateKey): string {
  const { day, month } = parseDateKey(key);
  return `${WEEKDAYS[getIsoWeekday(key) - 1]!} · ${pad(day)} ${MONTHS[month - 1]!}`;
}

/** Optional flavour per route; promises no activity. */
const SUBLABEL: Readonly<Record<DateOptionId, string>> = {
  'wed-30-sep': 'MIDWEEK ROUTE',
  'thu-01-oct': 'ALMOST WEEKEND',
  'sun-04-oct': 'SUNDAY SIDE QUEST',
};

export type GateView =
  | {
      kind: 'route';
      id: DateOptionId;
      label: string;
      sub: string;
      human: string;
      status: RouteStatus;
    }
  | { kind: 'mainQuest'; label: string; sub: string; time: string };

/** The four gates in calendar order: the three routes plus Friday's quest. */
export function dateGates(now: Date): GateView[] {
  const friday = MAIN_QUEST_ALREADY_ACTIVE;
  const { hour, minute } = friday.startsAt;
  const gates: { key: DateKey; view: GateView }[] = getDateRoutes(now).map(
    ({ option, status }) => ({
      key: option.dateKey,
      view: {
        kind: 'route',
        id: option.id,
        label: shortLabel(option.dateKey),
        sub: SUBLABEL[option.id],
        human: humanLabel(option.dateKey),
        status,
      },
    }),
  );
  gates.push({
    key: friday.dateKey,
    view: {
      kind: 'mainQuest',
      label: shortLabel(friday.dateKey),
      sub: friday.label,
      time: `${pad(hour)}:${pad(minute)} · THEATRE`,
    },
  });
  return gates.sort((a, b) => a.key.localeCompare(b.key)).map((g) => g.view);
}

export const chosenRouteLabel = (id: DateOptionId) => longLabel(getDateOption(id).dateKey);

/** Locked copy (GAME_08_COPY). One human line: Manu's. */
export const DATE_GATE_COPY = {
  title: 'SELECT DESTINATION',
  speaker: 'MANU',
  line: 'elige día y yo hago como que todo esto era un plan perfectamente normal.',
  confirm: 'LOCK THIS ROUTE?',
  locked: 'ROUTE LOCKED',
  saving: 'SAVING...',
  elapsed: 'ROUTE ELAPSED',
  expired: 'ROUTES EXPIRED',
  expiredHint: 'ENTER — RETURN TO TITLE',
  expiredLine: 'Las fechas de este guardado ya pasaron. Esta parte toca hablarla fuera del juego.',
} as const;
