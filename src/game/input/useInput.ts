import { useContext, useLayoutEffect, useRef } from 'react';
import { InputContext } from './InputContext';
import { INPUT_PRIORITY, type InputHandler } from './inputRouter';

/**
 * Registers an input layer while mounted (and `enabled`). The latest handler
 * is always used, so callers can pass inline functions.
 *
 * Layout effects (not passive ones) on purpose: they run during the commit,
 * so two keys pressed within the same frame (→ then Enter) always see the
 * state rendered by the first one, and a panel that just opened owns the
 * very next key press.
 */
export function useInput(
  handler: InputHandler,
  {
    priority = INPUT_PRIORITY.scene,
    enabled = true,
  }: { priority?: number; enabled?: boolean } = {},
): void {
  const router = useContext(InputContext);
  if (!router) throw new Error('useInput must be used inside <InputProvider>');
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useLayoutEffect(() => {
    if (!enabled) return;
    return router.add((input, meta) => handlerRef.current(input, meta), priority);
  }, [router, priority, enabled]);
}

/** Swallows all game input while mounted (transitions, blocking overlays). */
export function InputBlocker() {
  useInput(() => {}, { priority: INPUT_PRIORITY.blocker });
  return null;
}
