import { describe, expect, it, vi } from 'vitest';
import { createFullscreenController, type FullscreenDocument } from './fullscreen';

/** Minimal fake document that behaves like a standards-compliant browser. */
function fakeDocument(options: { enabled?: boolean; deny?: boolean; prefixedOnly?: boolean } = {}) {
  const { enabled = true, deny = false, prefixedOnly = false } = options;
  const listeners = new Map<string, Set<() => void>>();
  const emit = (type: string) => listeners.get(type)?.forEach((l) => l());
  const element = {} as Element;

  const doc: FullscreenDocument & { fire(type: string): void } = {
    fullscreenElement: null,
    documentElement: {},
    addEventListener: (type, l) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(l);
    },
    removeEventListener: (type, l) => listeners.get(type)?.delete(l),
    fire: emit,
  };

  if (prefixedOnly) {
    doc.webkitFullscreenEnabled = enabled;
    doc.webkitFullscreenElement = null;
    doc.documentElement.webkitRequestFullscreen = () => {
      doc.webkitFullscreenElement = element;
      emit('webkitfullscreenchange');
    };
    doc.webkitExitFullscreen = () => {
      doc.webkitFullscreenElement = null;
      emit('webkitfullscreenchange');
    };
  } else {
    doc.fullscreenEnabled = enabled;
    doc.documentElement.requestFullscreen = () => {
      if (deny) return Promise.reject(new TypeError('Permissions check failed'));
      doc.fullscreenElement = element;
      emit('fullscreenchange');
      return Promise.resolve();
    };
    doc.exitFullscreen = () => {
      doc.fullscreenElement = null;
      emit('fullscreenchange');
      return Promise.resolve();
    };
  }
  return doc;
}

describe('fullscreen controller', () => {
  it('is unsupported without a document (SSR / tests)', async () => {
    const fs = createFullscreenController(undefined);
    expect(fs.isSupported()).toBe(false);
    expect(await fs.request()).toBe('unsupported');
    await expect(fs.exit()).resolves.toBeUndefined();
  });

  it('is unsupported when the browser disables it (e.g. iframe)', async () => {
    const fs = createFullscreenController(fakeDocument({ enabled: false }));
    expect(fs.isSupported()).toBe(false);
    expect(await fs.request()).toBe('unsupported');
  });

  it('enters, reports state and exits', async () => {
    const fs = createFullscreenController(fakeDocument());
    expect(fs.isActive()).toBe(false);
    expect(await fs.request()).toBe('entered');
    expect(fs.isActive()).toBe(true);
    expect(await fs.request()).toBe('already');
    await fs.exit();
    expect(fs.isActive()).toBe(false);
  });

  it('turns a rejected request into "denied" instead of throwing', async () => {
    const fs = createFullscreenController(fakeDocument({ deny: true }));
    expect(await fs.request()).toBe('denied');
    expect(fs.isActive()).toBe(false);
  });

  it('retries once without options when the options object is rejected', async () => {
    const doc = fakeDocument();
    const calls: unknown[] = [];
    const element = {} as Element;
    doc.documentElement.requestFullscreen = (options?: FullscreenOptions) => {
      calls.push(options);
      if (options) return Promise.reject(new TypeError('navigationUI not supported'));
      doc.fullscreenElement = element;
      return Promise.resolve();
    };
    const fs = createFullscreenController(doc);
    expect(await fs.request()).toBe('entered');
    expect(calls).toEqual([{ navigationUI: 'hide' }, undefined]);
    expect(fs.isActive()).toBe(true);
  });

  it('returns "denied" only after both attempts fail', async () => {
    const doc = fakeDocument({ deny: true });
    const spy = vi.spyOn(doc.documentElement, 'requestFullscreen');
    expect(await createFullscreenController(doc).request()).toBe('denied');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not retry through the unprefixed API when only webkit exists', async () => {
    const doc = fakeDocument({ prefixedOnly: true });
    const spy = vi.spyOn(doc.documentElement, 'webkitRequestFullscreen');
    expect(await createFullscreenController(doc).request()).toBe('entered');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('supports the webkit-prefixed API', async () => {
    const fs = createFullscreenController(fakeDocument({ prefixedOnly: true }));
    expect(fs.isSupported()).toBe(true);
    expect(await fs.request()).toBe('entered');
    expect(fs.isActive()).toBe(true);
    await fs.exit();
    expect(fs.isActive()).toBe(false);
  });

  it('notifies subscribers on every change, including external exits (Escape)', async () => {
    const doc = fakeDocument();
    const fs = createFullscreenController(doc);
    const listener = vi.fn();
    const unsubscribe = fs.subscribe(listener);

    await fs.request();
    doc.fullscreenElement = null; // the browser left fullscreen on its own
    doc.fire('fullscreenchange');
    expect(listener.mock.calls).toEqual([[true], [false]]);

    unsubscribe();
    await fs.request();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('exit is a no-op when not fullscreen', async () => {
    const doc = fakeDocument();
    const exit = vi.spyOn(doc, 'exitFullscreen');
    await createFullscreenController(doc).exit();
    expect(exit).not.toHaveBeenCalled();
  });
});
