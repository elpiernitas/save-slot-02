import { useSyncExternalStore } from 'react';
import type { FullscreenController } from '../lib/fullscreen';

/** Live fullscreen state (updates on Escape / browser UI too). */
export function useFullscreen(controller: FullscreenController): {
  supported: boolean;
  active: boolean;
} {
  const active = useSyncExternalStore(controller.subscribe, controller.isActive, () => false);
  return { supported: controller.isSupported(), active };
}
