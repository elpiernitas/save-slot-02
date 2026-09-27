import { useEffect, useState, type ReactNode } from 'react';
import { InputContext } from './InputContext';
import { InputRouter } from './inputRouter';
import { inputFromKey } from './keymap';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** The single keyboard listener of the whole game. */
export function InputProvider({ children }: { children: ReactNode }) {
  const [router] = useState(() => new InputRouter());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditable(event.target)) return;
      const input = inputFromKey(event);
      if (!input) return;
      router.press(input);
      // Stop Space/arrows from scrolling and Enter from re-clicking a focused button.
      if (router.dispatch(input, { repeat: event.repeat })) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      // Release even with modifiers held, so a direction never gets stuck.
      const input = inputFromKey({
        ...event,
        code: event.code,
        key: event.key,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });
      if (input) router.release(input);
    };
    const onBlur = () => router.releaseAll();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [router]);

  return <InputContext value={router}>{children}</InputContext>;
}
