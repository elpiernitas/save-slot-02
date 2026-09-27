import { MURALLA_SCRIPTS } from '../content/dialogue/muralla';
import type { DialogueScript } from '../dialogue/types';
import type { Interactable } from './types';

/** World → dialogue bridge: which script an interactable opens (pure). */
export function scriptForInteractable(
  interactable: Interactable,
  scripts: Readonly<Record<string, DialogueScript>> = MURALLA_SCRIPTS,
): DialogueScript | null {
  return scripts[interactable.script] ?? null;
}
