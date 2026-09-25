import { useMediaQuery } from './useMediaQuery';

export type Orientation = 'landscape' | 'portrait';

/**
 * Viewport orientation (not device sensors): portrait whenever the viewport is
 * taller than wide. GAME-01 uses this to show "ROTATE DEVICE TO CONTINUE".
 */
export function useOrientation(): Orientation {
  return useMediaQuery('(orientation: portrait)') ? 'portrait' : 'landscape';
}
