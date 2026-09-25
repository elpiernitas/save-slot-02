/**
 * Logical game inputs. Screens react to these, never to raw keys, so the
 * mapping (and future gamepad support) lives in one place.
 */
export type GameInput = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel';

/** Physical key positions (`KeyboardEvent.code`): WASD works on any layout. */
const CODE_TO_INPUT: Readonly<Record<string, GameInput>> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  Space: 'confirm',
  Escape: 'cancel',
};

/** Fallback on `key` for environments that leave `code` empty. */
const KEY_TO_INPUT: Readonly<Record<string, GameInput>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'confirm',
  ' ': 'confirm',
  Escape: 'cancel',
  Esc: 'cancel',
};

export interface KeyLike {
  code: string;
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

/** Returns the game input for a key event, or null if the game should ignore it. */
export function inputFromKey(event: KeyLike): GameInput | null {
  // Never steal browser/OS shortcuts (Ctrl+S, Cmd+W, Alt+Arrow…).
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  return CODE_TO_INPUT[event.code] ?? KEY_TO_INPUT[event.key] ?? null;
}
