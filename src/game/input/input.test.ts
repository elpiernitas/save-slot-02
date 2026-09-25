import { describe, expect, it, vi } from 'vitest';
import { INPUT_PRIORITY, InputRouter } from './inputRouter';
import { inputFromKey, type KeyLike } from './keymap';
import { firstEnabledIndex, moveSelection } from './menu';

const key = (code: string, extra: Partial<KeyLike> = {}): KeyLike => ({
  code,
  key: '',
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  ...extra,
});

describe('inputFromKey', () => {
  it.each([
    ['ArrowUp', 'up'],
    ['KeyW', 'up'],
    ['ArrowDown', 'down'],
    ['KeyS', 'down'],
    ['ArrowLeft', 'left'],
    ['KeyA', 'left'],
    ['ArrowRight', 'right'],
    ['KeyD', 'right'],
    ['Enter', 'confirm'],
    ['NumpadEnter', 'confirm'],
    ['Space', 'confirm'],
    ['Escape', 'cancel'],
  ])('%s → %s', (code, input) => {
    expect(inputFromKey(key(code))).toBe(input);
  });

  it('falls back to `key` when `code` is empty', () => {
    expect(inputFromKey(key('', { key: ' ' }))).toBe('confirm');
    expect(inputFromKey(key('', { key: 'Escape' }))).toBe('cancel');
  });

  it('ignores unmapped keys and browser shortcuts', () => {
    expect(inputFromKey(key('KeyQ'))).toBeNull();
    expect(inputFromKey(key('KeyS', { ctrlKey: true }))).toBeNull();
    expect(inputFromKey(key('KeyW', { metaKey: true }))).toBeNull();
    expect(inputFromKey(key('ArrowLeft', { altKey: true }))).toBeNull();
  });
});

describe('InputRouter', () => {
  it('reports unhandled input when nothing is listening', () => {
    expect(new InputRouter().dispatch('confirm', { repeat: false })).toBe(false);
  });

  it('delivers only to the top layer (priority, then most recent)', () => {
    const router = new InputRouter();
    const scene = vi.fn();
    const panel = vi.fn();
    const removePanel = router.add(panel, INPUT_PRIORITY.panel);
    router.add(scene, INPUT_PRIORITY.scene); // added later but lower priority

    router.dispatch('down', { repeat: false });
    expect(panel).toHaveBeenCalledWith('down', { repeat: false });
    expect(scene).not.toHaveBeenCalled();

    removePanel();
    router.dispatch('up', { repeat: true });
    expect(scene).toHaveBeenCalledWith('up', { repeat: true });
  });

  it('a blocker swallows everything until removed', () => {
    const router = new InputRouter();
    const scene = vi.fn();
    router.add(scene);
    const unblock = router.add(() => {}, INPUT_PRIORITY.blocker);
    expect(router.dispatch('confirm', { repeat: false })).toBe(true);
    expect(scene).not.toHaveBeenCalled();
    unblock();
    router.dispatch('confirm', { repeat: false });
    expect(scene).toHaveBeenCalledOnce();
    expect(router.size).toBe(1);
  });

  it('ties go to the most recently added layer', () => {
    const router = new InputRouter();
    const a = vi.fn();
    const b = vi.fn();
    router.add(a);
    router.add(b);
    router.dispatch('left', { repeat: false });
    expect(b).toHaveBeenCalled();
    expect(a).not.toHaveBeenCalled();
  });
});

describe('menu navigation', () => {
  const items = [{}, { disabled: true }, {}, {}];

  it('moves and wraps', () => {
    expect(moveSelection(items, 0, 1)).toBe(2); // skips disabled
    expect(moveSelection(items, 3, 1)).toBe(0); // wraps
    expect(moveSelection(items, 0, -1)).toBe(3);
  });

  it('can clamp instead of wrapping', () => {
    expect(moveSelection(items, 3, 1, false)).toBe(3);
    expect(moveSelection(items, 0, -1, false)).toBe(0);
  });

  it('handles degenerate menus', () => {
    expect(moveSelection([], 0, 1)).toBe(0);
    expect(moveSelection([{ disabled: true }], 0, 1)).toBe(0);
    expect(firstEnabledIndex([{ disabled: true }, {}])).toBe(1);
    expect(firstEnabledIndex([])).toBe(0);
  });
});
