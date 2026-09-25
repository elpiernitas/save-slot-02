import { describe, expect, it } from 'vitest';
import { evaluateDisplay, type DisplaySignals } from './displayGate';

const desktop = (
  w: number,
  h: number,
  screen: [number, number] = [1920, 1080],
): DisplaySignals => ({
  viewportWidth: w,
  viewportHeight: h,
  screenWidth: screen[0],
  screenHeight: screen[1],
  primaryPointerCoarse: false,
  anyPointerFine: true,
});

const touch = (w: number, h: number): DisplaySignals => ({
  viewportWidth: w,
  viewportHeight: h,
  screenWidth: w,
  screenHeight: h,
  primaryPointerCoarse: true,
  anyPointerFine: false,
});

describe('evaluateDisplay', () => {
  it.each([
    [1920, 1080],
    [1440, 900],
    [1366, 657], // 1366×768 laptop minus browser chrome
    [800, 450],
  ])('lets a %i×%i desktop window play', (w, h) => {
    expect(evaluateDisplay(desktop(w, h))).toEqual({ kind: 'ok' });
  });

  it('asks to enlarge a small desktop window', () => {
    expect(evaluateDisplay(desktop(799, 600))).toEqual({
      kind: 'tooSmall',
      requiredWidth: 800,
      requiredHeight: 450,
    });
    expect(evaluateDisplay(desktop(1200, 449)).kind).toBe('tooSmall');
  });

  it('blocks phones in either orientation', () => {
    expect(evaluateDisplay(touch(390, 844))).toEqual({ kind: 'incompatible', reason: 'handheld' });
    expect(evaluateDisplay(touch(844, 390))).toEqual({ kind: 'incompatible', reason: 'handheld' });
  });

  it('does not block a large touch-only tablet just for being touch', () => {
    expect(evaluateDisplay(touch(1180, 820)).kind).toBe('ok');
  });

  it('treats a touch laptop (touch + trackpad) as a computer', () => {
    expect(evaluateDisplay({ ...desktop(1280, 720), primaryPointerCoarse: true }).kind).toBe('ok');
  });

  it('never calls a computer with a mouse incompatible, even if `screen` looks tiny', () => {
    // Privacy modes / emulators may report screen = window size.
    expect(evaluateDisplay(desktop(700, 400, [700, 400])).kind).toBe('tooSmall');
  });

  it('still blocks a touch-only phone when `screen` is unknown', () => {
    expect(evaluateDisplay({ ...touch(390, 844), screenWidth: 0, screenHeight: 0 }).kind).toBe(
      'incompatible',
    );
  });

  it('does not block when the screen size is unknown (0×0)', () => {
    expect(evaluateDisplay(desktop(1280, 720, [0, 0])).kind).toBe('ok');
  });
});
