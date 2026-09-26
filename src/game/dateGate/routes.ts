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

const WEEKDAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
const WEEKDAYS_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const MONTHS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

const pad = (n: number) => String(n).padStart(2, '0');
const lower = (s: string) => s.toLowerCase();
const cap = (s: string) => s.charAt(0) + lower(s.slice(1));

/** `MIÉ · 30 SEP` (gate label). */
export function shortLabel(key: DateKey): string {
  const { day, month } = parseDateKey(key);
  return `${WEEKDAYS_SHORT[getIsoWeekday(key) - 1]!} · ${pad(day)} ${MONTHS[month - 1]!.slice(0, 3)}`;
}

/** `Jueves · 1 de octubre` (confirmation). */
export function humanLabel(key: DateKey): string {
  const { day, month } = parseDateKey(key);
  return `${cap(WEEKDAYS[getIsoWeekday(key) - 1]!)} · ${day} de ${lower(MONTHS[month - 1]!)}`;
}

/** `JUEVES · 1 DE OCTUBRE` (ending and save slot). */
export function longLabel(key: DateKey): string {
  const { day, month } = parseDateKey(key);
  return `${WEEKDAYS[getIsoWeekday(key) - 1]!} · ${day} DE ${MONTHS[month - 1]!}`;
}

/** Optional flavour per route; promises no activity. */
const SUBLABEL: Readonly<Record<DateOptionId, string>> = {
  'wed-30-sep': 'MITAD DE SEMANA',
  'thu-01-oct': 'CASI FINDE',
  'sun-04-oct': 'MISIÓN DE DOMINGO',
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
      sub: DATE_GATE_COPY.mainQuest,
      time: `${pad(hour)}:${pad(minute)} · TEATRO`,
    },
  });
  return gates.sort((a, b) => a.key.localeCompare(b.key)).map((g) => g.view);
}

export const chosenRouteLabel = (id: DateOptionId) => longLabel(getDateOption(id).dateKey);

/** Locked copy (GAME_08_COPY). One human line: Manu's. */
export const DATE_GATE_COPY = {
  title: 'ELIGE RUTA',
  mainQuest: 'MISIÓN PRINCIPAL YA ACTIVA',
  speaker: 'MANU',
  line: 'elige día y yo hago como que todo esto era un plan perfectamente normal.',
  confirm: '¿FIJAR ESTA RUTA?',
  locked: 'RUTA FIJADA',
  saving: 'GUARDANDO...',
  elapsed: 'RUTA CADUCADA',
  expired: 'RUTAS CADUCADAS',
  expiredHint: 'ENTER — VOLVER AL TÍTULO',
  expiredLine: 'Las fechas de este guardado ya pasaron. Esta parte toca hablarla fuera del juego.',
} as const;
