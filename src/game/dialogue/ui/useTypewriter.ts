import { useEffect, useRef, useState } from 'react';
import { shouldBlip, visibleGlyphCount, type Timeline } from '../typewriter';

/**
 * Plays a page's timeline with requestAnimationFrame. Mount one per page
 * (keyed) so every page starts fresh without resetting state in effects.
 */
export function useTypewriter(timeline: Timeline, onBlip?: () => void) {
  const total = timeline.glyphs.length;
  const [count, setCount] = useState(() => (timeline.totalMs === 0 ? total : 0));
  const [skipped, setSkipped] = useState(false);

  const onBlipRef = useRef(onBlip);
  useEffect(() => {
    onBlipRef.current = onBlip;
  });

  useEffect(() => {
    if (skipped || timeline.totalMs === 0) return;
    let frame = 0;
    let shown = 0;
    let lastBlip: number | null = null;
    const start = performance.now();
    const tick = (now: number) => {
      const next = visibleGlyphCount(timeline, now - start);
      if (next !== shown) {
        if (onBlipRef.current && shouldBlip(timeline.glyphs.slice(shown, next), now, lastBlip)) {
          onBlipRef.current();
          lastBlip = now;
        }
        shown = next;
        setCount(next);
      }
      if (next < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [timeline, skipped, total]);

  const visible = skipped ? total : count;
  return { visible, done: visible >= total, revealAll: () => setSkipped(true) };
}
