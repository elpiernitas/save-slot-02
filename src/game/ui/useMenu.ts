import { useCallback, useState } from 'react';
import { createFreshInputGate, firstEnabledIndex, moveSelection } from '../input/menu';
import { INPUT_PRIORITY } from '../input/inputRouter';
import { useInput } from '../input/useInput';
import { useGame } from '../state/useGame';

export interface MenuItem {
  id: string;
  label: string;
  /** Right-aligned value, e.g. "ON" / "OFF". */
  value?: string;
  disabled?: boolean;
}

export interface UseMenuOptions {
  items: readonly MenuItem[];
  onConfirm: (item: MenuItem) => void;
  onCancel?: () => void;
  /** Left/right on an item (settings values). */
  onAdjust?: (item: MenuItem, direction: -1 | 1) => void;
  priority?: number;
  enabled?: boolean;
  /**
   * Ignore auto-repeats from a key held before the menu opened (menus that
   * interrupt action, e.g. the boss defeat panel). See createFreshInputGate.
   */
  ignoreHeldKeys?: boolean;
}

/**
 * Keyboard + mouse menu behaviour: up/down (wrapping), confirm, cancel,
 * left/right adjust, UI blips. Rendering is done by <Menu>.
 */
export function useMenu({
  items,
  onConfirm,
  onCancel,
  onAdjust,
  priority = INPUT_PRIORITY.scene,
  enabled = true,
  ignoreHeldKeys = false,
}: UseMenuOptions) {
  const { services } = useGame();
  const [fresh] = useState(createFreshInputGate);
  const [selected, setSelectedState] = useState(() => firstEnabledIndex(items));
  const current = Math.min(selected, Math.max(0, items.length - 1));

  const select = useCallback(
    (index: number) => {
      if (index === current || items[index]?.disabled) return;
      services.audio.playSfx('cursor');
      setSelectedState(index);
    },
    [current, items, services.audio],
  );

  const confirm = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || item.disabled) return;
      services.audio.playSfx('confirm');
      onConfirm(item);
    },
    [items, onConfirm, services.audio],
  );

  useInput(
    (input, { repeat }) => {
      if (ignoreHeldKeys && !fresh(repeat)) return;
      switch (input) {
        case 'up':
        case 'down':
          select(moveSelection(items, current, input === 'up' ? -1 : 1));
          break;
        case 'left':
        case 'right': {
          const item = items[current];
          if (item && !item.disabled && onAdjust && !repeat) {
            services.audio.playSfx('cursor');
            onAdjust(item, input === 'left' ? -1 : 1);
          }
          break;
        }
        case 'confirm':
          if (!repeat) confirm(current);
          break;
        case 'cancel':
          if (onCancel && !repeat) {
            services.audio.playSfx('cancel');
            onCancel();
          }
          break;
      }
    },
    { priority, enabled },
  );

  return { selected: current, select, confirm };
}
