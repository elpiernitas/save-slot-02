import type { SceneId } from './sceneIds';

/** Stepped cut-to-black: short enough to feel like a hardware screen swap. */
export const TRANSITION_COVER_MS = 110;
export const TRANSITION_REVEAL_MS = 150;

export type TransitionPhase = 'idle' | 'cover' | 'reveal';

export interface TransitionInput {
  /** Scene the save wants to show. */
  target: SceneId;
  /** Scene currently mounted (lags behind `target` while covering). */
  shown: SceneId;
  /** True during the short reveal after the swap. */
  revealing: boolean;
  reduced: boolean;
}

/**
 * Pure view of the scene transition. React state only stores `shown` and
 * `revealing` (both changed from timers); everything else is derived here,
 * so no state update ever happens during render.
 */
export function getTransitionView({ target, shown, revealing, reduced }: TransitionInput): {
  displayed: SceneId;
  phase: TransitionPhase;
} {
  if (reduced) return { displayed: target, phase: 'idle' };
  if (target !== shown) return { displayed: shown, phase: 'cover' };
  if (revealing) return { displayed: shown, phase: 'reveal' };
  return { displayed: shown, phase: 'idle' };
}
