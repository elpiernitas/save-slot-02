import { describe, expect, it, vi } from 'vitest';
import { INPUT_PRIORITY, InputRouter } from './inputRouter';
import { inputFromKey, type KeyLike } from './keymap';
import { createFreshInputGate, firstEnabledIndex, moveSelection } from './menu';

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
    ['KeyE', 'confirm'],
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

describe('held directions (continuous movement)', () => {
  it('tracks the most recently pressed direction still held', () => {
    const router = new InputRouter();
    expect(router.heldDirection()).toBeNull();
    router.press('right');
    router.press('up');
    expect(router.heldDirection()).toBe('up');
    router.release('up');
    expect(router.heldDirection()).toBe('right');
  });

  it('ignores non-directions and forgets everything on blur', () => {
    const router = new InputRouter();
    router.press('confirm');
    expect(router.heldDirection()).toBeNull();
    router.press('left');
    router.releaseAll();
    expect(router.heldDirection()).toBeNull();
  });

  it('reports which layer owns input', () => {
    const router = new InputRouter();
    const world = vi.fn();
    const dialogue = vi.fn();
    router.add(world);
    expect(router.isTop(world)).toBe(true);
    const close = router.add(dialogue);
    expect(router.isTop(world)).toBe(false);
    close();
    expect(router.isTop(world)).toBe(true);
  });
});

describe('world input layer', () => {
  it('sits below scenes, so any dialogue or menu owns input', () => {
    const router = new InputRouter();
    const dialogue = vi.fn();
    router.add(dialogue, INPUT_PRIORITY.scene); // mounted first (child layout effect)
    const world = vi.fn();
    router.add(world, INPUT_PRIORITY.world); // registered later by the scene
    router.dispatch('confirm', { repeat: false });
    expect(dialogue).toHaveBeenCalled();
    expect(world).not.toHaveBeenCalled();
    expect(router.isTop(world)).toBe(false);
  });
});

describe('fresh input gate (boss defeat menu regression)', () => {
  const items = [{ disabled: false }, { disabled: false }]; // REINTENTAR, VOLVER AL TÍTULO

  /** Replays key events through the gate the way useMenu does. */
  function replay(events: { input: 'up' | 'down' | 'confirm'; repeat: boolean }[]) {
    const fresh = createFreshInputGate();
    let selected = firstEnabledIndex(items);
    let confirmed: number | null = null;
    for (const { input, repeat } of events) {
      if (!fresh(repeat)) continue;
      if (input === 'confirm') confirmed ??= selected;
      else selected = moveSelection(items, selected, input === 'up' ? -1 : 1);
    }
    return { selected, confirmed };
  }

  it('opens on REINTENTAR and ignores a direction held from the fight', () => {
    const held = Array.from({ length: 12 }, () => ({ input: 'down' as const, repeat: true }));
    expect(replay(held)).toEqual({ selected: 0, confirmed: null });
    expect(replay([...held, { input: 'confirm', repeat: false }])).toEqual({
      selected: 0,
      confirmed: 0,
    });
  });

  it('ignores a held confirm too', () => {
    expect(replay([{ input: 'confirm', repeat: true }]).confirmed).toBeNull();
  });

  it('navigates normally after a fresh press, including held repeats', () => {
    expect(
      replay([
        { input: 'down', repeat: false },
        { input: 'down', repeat: true },
      ]).selected,
    ).toBe(0); // wraps: 0 → 1 → 0
    expect(replay([{ input: 'down', repeat: false }]).selected).toBe(1);
  });
});
