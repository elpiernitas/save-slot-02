import { MURALLA_SCRIPTS } from '../content/dialogue/muralla';
import type { DialogueScript } from '../dialogue/types';
import type { GameSave } from '../state/types';
import type { Interactable } from './types';

/** World → dialogue bridge: which script an interactable opens (pure). */
export function scriptForInteractable(
  interactable: Interactable,
  scripts: Readonly<Record<string, DialogueScript>> = MURALLA_SCRIPTS,
  save?: GameSave,
): DialogueScript | null {
  if (save && interactable.id === 'barWindowLeft') {
    const looks = Number(save.flags['muralla.leftWindowLooks'] ?? 0);
    const id =
      looks === 0
        ? 'muralla.window.left.first'
        : looks === 1
          ? 'muralla.window.left.second'
          : 'muralla.window.left.again';
    return scripts[id] ?? scripts[interactable.script] ?? null;
  }
  if (save && interactable.id === 'barWindowRight') {
    const looks = Number(save.flags['muralla.rightWindowLooks'] ?? 0);
    const id =
      looks === 0
        ? 'muralla.window.right.first'
        : looks === 1
          ? 'muralla.window.right.second'
          : looks === 2
            ? 'muralla.window.right.third'
            : 'muralla.window.right.again';
    return scripts[id] ?? scripts[interactable.script] ?? null;
  }
  return scripts[interactable.script] ?? null;
}
