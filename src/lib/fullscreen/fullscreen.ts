/**
 * Thin, testable wrapper around the Fullscreen API.
 *
 * Browser rules this module respects:
 * - `request()` only works from inside a user gesture (click / keydown other
 *   than Escape). It must be called synchronously from the handler — do not
 *   `await` anything before calling it.
 * - The player can always leave with Escape (or the browser UI); the game
 *   must keep working in a window.
 * - F11 / OS fullscreen cannot be triggered from code and is not attempted.
 *
 * Nothing else in the app touches `document.fullscreenElement`,
 * `requestFullscreen` or `exitFullscreen` directly.
 */

export type FullscreenRequestResult =
  /** The browser accepted the request. */
  | 'entered'
  /** Already fullscreen; nothing to do. */
  | 'already'
  /** API missing or disabled (e.g. iframe without `allowfullscreen`). */
  | 'unsupported'
  /** Browser/user refused, or the call was not inside a user gesture. */
  | 'denied';

/** The subset of `Element` this module needs (prefixed for older Safari). */
export interface FullscreenTarget {
  requestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
  webkitRequestFullscreen?: () => void;
}

/** The subset of `Document` this module needs. Injectable for tests. */
export interface FullscreenDocument {
  fullscreenEnabled?: boolean;
  webkitFullscreenEnabled?: boolean;
  fullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
  exitFullscreen?: () => Promise<void>;
  webkitExitFullscreen?: () => void;
  documentElement: FullscreenTarget;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface FullscreenController {
  isSupported(): boolean;
  isActive(): boolean;
  /** Must be called synchronously inside a user gesture. Never throws. */
  request(target?: FullscreenTarget): Promise<FullscreenRequestResult>;
  /** Never throws; resolves when done or when there was nothing to exit. */
  exit(): Promise<void>;
  /** Called with the new state on every change (including Escape). Returns unsubscribe. */
  subscribe(listener: (active: boolean) => void): () => void;
}

const CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'] as const;

export function createFullscreenController(
  doc: FullscreenDocument | undefined = typeof document === 'undefined'
    ? undefined
    : (document as unknown as FullscreenDocument),
): FullscreenController {
  if (!doc) return unsupportedController;

  const isSupported = () =>
    Boolean(
      (doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled) &&
      (doc.documentElement.requestFullscreen || doc.documentElement.webkitRequestFullscreen),
    );

  const isActive = () => Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);

  return {
    isSupported,
    isActive,

    async request(target = doc.documentElement) {
      if (!isSupported()) return 'unsupported';
      if (isActive()) return 'already';
      try {
        if (target.requestFullscreen) {
          await target.requestFullscreen({ navigationUI: 'hide' });
        } else if (target.webkitRequestFullscreen) {
          // Legacy Safari: no promise, no error reporting.
          target.webkitRequestFullscreen();
        } else {
          return 'unsupported';
        }
        return 'entered';
      } catch {
        return 'denied';
      }
    },

    async exit() {
      if (!isActive()) return;
      try {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else doc.webkitExitFullscreen?.();
      } catch {
        // Already left (e.g. Escape raced us). Nothing to do.
      }
    },

    subscribe(listener) {
      const handler = () => listener(isActive());
      for (const type of CHANGE_EVENTS) doc.addEventListener(type, handler);
      return () => {
        for (const type of CHANGE_EVENTS) doc.removeEventListener(type, handler);
      };
    },
  };
}

const unsupportedController: FullscreenController = {
  isSupported: () => false,
  isActive: () => false,
  request: () => Promise.resolve('unsupported'),
  exit: () => Promise.resolve(),
  subscribe: () => () => {},
};
