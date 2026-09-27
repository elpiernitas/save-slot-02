/**
 * Logical resolution of the exploration view (16:9). The UI keeps its own
 * 480×270 layout grid (--px); only the world canvas uses this.
 * Decision and comparison: DECISION_LOG D-049.
 */
export const WORLD_VIEWS = {
  480: { w: 480, h: 270 },
  640: { w: 640, h: 360 },
} as const;

export type WorldViewId = keyof typeof WORLD_VIEWS;

export const DEFAULT_WORLD_VIEW: WorldViewId = 640;

/** Dev-only comparison switch: `?worldRes=480`. Ignored in production. */
export function worldViewFromQuery(search: string, isDev: boolean): { w: number; h: number } {
  const requested = isDev ? Number(new URLSearchParams(search).get('worldRes')) : NaN;
  const id = (requested in WORLD_VIEWS ? requested : DEFAULT_WORLD_VIEW) as WorldViewId;
  return WORLD_VIEWS[id];
}
