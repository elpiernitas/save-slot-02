import type { BeaconSymbol } from './routeBeacons';

/**
 * Route beacon symbols: three clearly different silhouettes (not colour-only)
 * drawn as UI glyphs on a 16×16 grid.
 */
const PATHS: Record<BeaconSymbol, string> = {
  // Cup with handle and steam.
  cup: 'M3 7h8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM11 8h2a2 2 0 0 1 0 4h-2M5 2v3M8 2v3',
  // Street lantern: cap, glass box, post, base.
  lamp: 'M6 1h4M5 3h6v4H5zM8 7v7M6 14h4',
  // Gull in flight.
  bird: 'M1 7c2-2 5-2 7 1 2-3 5-3 7-1M8 8v1',
};

export function BeaconIcon({ symbol, label }: { symbol: BeaconSymbol; label?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="beacon-icon"
      data-symbol={symbol}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[symbol]} />
    </svg>
  );
}
