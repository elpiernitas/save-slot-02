import { useEffect, useState } from 'react';
import { evaluateDisplay, type DisplaySignals, type DisplayStatus } from '../lib/display';

function readSignals(): DisplaySignals {
  const mq = (query: string) => window.matchMedia?.(query).matches ?? false;
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    screenWidth: window.screen?.width ?? 0,
    screenHeight: window.screen?.height ?? 0,
    primaryPointerCoarse: mq('(pointer: coarse)'),
    anyPointerFine: mq('(any-pointer: fine)'),
  };
}

function sameStatus(a: DisplayStatus, b: DisplayStatus): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Re-evaluates the display gate on resize / pointer changes. */
export function useDisplayStatus(): DisplayStatus {
  const [status, setStatus] = useState(() => evaluateDisplay(readSignals()));

  useEffect(() => {
    const update = () => {
      const next = evaluateDisplay(readSignals());
      setStatus((prev) => (sameStatus(prev, next) ? prev : next));
    };
    const queries = ['(pointer: coarse)', '(any-pointer: fine)']
      .map((q) => window.matchMedia?.(q))
      .filter((mql): mql is MediaQueryList => Boolean(mql));
    window.addEventListener('resize', update);
    for (const mql of queries) mql.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      for (const mql of queries) mql.removeEventListener('change', update);
    };
  }, []);

  return status;
}
