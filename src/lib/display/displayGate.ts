/**
 * Decides whether the current screen can run the game. Pure and testable:
 * the React hook only gathers the signals.
 *
 * Deliberately no user-agent sniffing and no device model lists. We combine:
 * - pointer capabilities (touch-only vs. has a mouse/trackpad),
 * - the physical screen size (only for touch-only devices: is it a phone?),
 * - the current viewport size (is the window big enough *right now*?).
 *
 * Anything with a mouse/trackpad is treated as a computer and is never
 * "incompatible", only possibly "too small": some browsers (privacy modes,
 * emulators) report `screen` equal to the window, which must not lock out a
 * real computer.
 */

export interface DisplaySignals {
  /** `window.innerWidth/innerHeight` in CSS px. */
  viewportWidth: number;
  viewportHeight: number;
  /** `screen.width/height` in CSS px. */
  screenWidth: number;
  screenHeight: number;
  /** `(pointer: coarse)` — the primary pointer is a finger. */
  primaryPointerCoarse: boolean;
  /** `(any-pointer: fine)` — some mouse/trackpad/pen is available. */
  anyPointerFine: boolean;
}

export interface DisplayThresholds {
  /** Minimum window size to play. 800×450 = the 480×270 stage at ≥ 1.67×. */
  minViewportWidth: number;
  minViewportHeight: number;
  /** Touch-only devices whose screen's short side is below this are "handheld". */
  handheldMaxShortSide: number;
}

export const DEFAULT_DISPLAY_THRESHOLDS: DisplayThresholds = {
  minViewportWidth: 800,
  minViewportHeight: 450,
  handheldMaxShortSide: 600,
};

export type DisplayStatus =
  | { kind: 'ok' }
  /** Phone-like device. Blocks before the game. */
  | { kind: 'incompatible'; reason: 'handheld' }
  /** A desktop window that is currently too small. Resolves by resizing. */
  | { kind: 'tooSmall'; requiredWidth: number; requiredHeight: number };

export function evaluateDisplay(
  signals: DisplaySignals,
  thresholds: DisplayThresholds = DEFAULT_DISPLAY_THRESHOLDS,
): DisplayStatus {
  const { minViewportWidth, minViewportHeight, handheldMaxShortSide } = thresholds;
  const touchOnly = signals.primaryPointerCoarse && !signals.anyPointerFine;
  // Use the larger of screen and viewport: a 0×0 (unknown) screen can't hide a big window.
  const shortSide = Math.max(
    Math.min(signals.screenWidth, signals.screenHeight),
    Math.min(signals.viewportWidth, signals.viewportHeight),
  );

  if (touchOnly && shortSide < handheldMaxShortSide) {
    return { kind: 'incompatible', reason: 'handheld' };
  }
  if (signals.viewportWidth < minViewportWidth || signals.viewportHeight < minViewportHeight) {
    return { kind: 'tooSmall', requiredWidth: minViewportWidth, requiredHeight: minViewportHeight };
  }
  return { kind: 'ok' };
}
