import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useGame } from '../state/useGame';

/** Player setting wins; `system` follows `prefers-reduced-motion`. */
export function useReducedMotion(): boolean {
  const { save } = useGame();
  const system = usePrefersReducedMotion();
  const setting = save.settings.reducedMotion;
  return setting === 'on' ? true : setting === 'off' ? false : system;
}
