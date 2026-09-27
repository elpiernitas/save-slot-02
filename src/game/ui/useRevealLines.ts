import { useCallback, useEffect, useState } from 'react';

/**
 * Reveals `total` items one by one every `stepMs` (boot logs, stat rows…).
 * `instant` shows everything at once (reduced motion / returning player).
 */
export function useRevealLines(total: number, stepMs: number, instant = false) {
  const [shown, setShown] = useState(instant ? total : 0);
  const done = shown >= total;

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setShown((n) => Math.min(total, n + 1)), stepMs);
    return () => window.clearTimeout(id);
  }, [shown, done, total, stepMs]);

  const revealAll = useCallback(() => setShown(total), [total]);
  return { shown: instant ? total : shown, done: instant || done, revealAll };
}
