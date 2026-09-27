import { useEffect, useState } from 'react';
import {
  evaluateDisplay,
  nextDisplayGateState,
  type DisplayGateState,
  type DisplaySignals,
} from '../lib/display';

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

/**
 * Display gate status plus the "has the game ever been allowed to start"
 * latch. State only changes from the initializer and from resize / pointer
 * events — never during render.
 */
export function useDisplayStatus(): DisplayGateState {
  const [state, setState] = useState(() =>
    nextDisplayGateState(null, evaluateDisplay(readSignals())),
  );

  useEffect(() => {
    const update = () =>
      setState((prev) => nextDisplayGateState(prev, evaluateDisplay(readSignals())));
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

  return state;
}
