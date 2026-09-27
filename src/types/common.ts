/**
 * Shared primitive aliases. They are plain strings at runtime (JSON-safe for
 * the save file) but make intent explicit in signatures.
 */

/** Calendar date in the game time zone, formatted `YYYY-MM-DD`. */
export type DateKey = string;

/** Absolute instant serialised with `Date.prototype.toISOString()` (UTC). */
export type IsoTimestamp = string;

/** Deep readonly helper for static content tables (items, cards, scripts…). */
export type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;
