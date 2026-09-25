import { describe, expect, it } from 'vitest';
import { parseMarkup } from './markup';
import {
  buildTimeline,
  CLAUSE_PAUSE_MS,
  CONFIRM_COOLDOWN_MS,
  isVoicedChar,
  resolveConfirm,
  SENTENCE_PAUSE_MS,
  shouldBlip,
  TEXT_SPEED_DELAY_MS,
  visibleGlyphCount,
} from './typewriter';

const timeline = (text: string, speed: Parameters<typeof buildTimeline>[1] = 'normal') =>
  buildTimeline(parseMarkup(text).tokens, speed);

describe('typewriter timeline', () => {
  it('reveals one character per speed step', () => {
    const t = timeline('abc');
    const step = TEXT_SPEED_DELAY_MS.normal;
    expect(t.glyphs.map((g) => g.at)).toEqual([step, step * 2, step * 3]);
    expect(visibleGlyphCount(t, step * 2)).toBe(2);
  });

  it('orders the speed settings sensibly', () => {
    const total = (s: 'slow' | 'normal' | 'fast') => timeline('Hola, mundo.', s).totalMs;
    expect(total('slow')).toBeGreaterThan(total('normal'));
    expect(total('normal')).toBeGreaterThan(total('fast'));
  });

  it('instant speed shows everything at time 0 (also used for reduced typing)', () => {
    const t = timeline('Hola.[pause=900] Adiós.', 'instant');
    expect(t.totalMs).toBe(0);
    expect(visibleGlyphCount(t, 0)).toBe(t.glyphs.length);
  });

  it('adds short pauses after punctuation, once per run, never at the end', () => {
    const step = TEXT_SPEED_DELAY_MS.normal;
    const comma = timeline('a,b');
    expect(comma.glyphs[2]!.at).toBe(step * 3 + CLAUSE_PAUSE_MS);
    const dots = timeline('a...b');
    // only the last "." of "..." pauses
    expect(dots.glyphs[4]!.at).toBe(step * 5 + SENTENCE_PAUSE_MS);
    expect(timeline('Fin.').totalMs).toBe(step * 4);
  });

  it('keeps pauses short enough to read comfortably', () => {
    // A typical 90-character page stays under ~4 s at normal speed.
    const page =
      'El cursor parpadea donde no debería haber nada. Ni menú, ni mapa: solo un archivo.';
    expect(timeline(page).totalMs).toBeLessThan(4000);
  });

  it('honours [pause], [slow] and [fast]', () => {
    const step = TEXT_SPEED_DELAY_MS.normal;
    expect(timeline('a[pause=500]b').glyphs[1]!.at).toBe(step * 2 + 500);
    expect(timeline('[slow]a[/slow]').glyphs[0]!.at).toBe(step * 2);
    expect(timeline('[fast]a[/fast]').glyphs[0]!.at).toBe(step / 2);
  });

  it('turns \\n into a break glyph without extra time', () => {
    const t = timeline('a\nb');
    expect(t.glyphs.map((g) => g.isBreak)).toEqual([false, true, false]);
  });
});

describe('voice blips', () => {
  const g = (char: string) => ({
    char,
    style: { em: false, shake: false, sys: false, pace: 1 },
    at: 0,
    isBreak: false,
  });

  it('only letters and digits are voiced', () => {
    expect(['a', 'Ñ', 'é', '7'].every(isVoicedChar)).toBe(true);
    expect([' ', '.', '¿', '…', '!'].some(isVoicedChar)).toBe(false);
  });

  it('throttles blips to avoid a machine-gun effect', () => {
    expect(shouldBlip([g('a')], 100, null)).toBe(true);
    expect(shouldBlip([g('b')], 130, 100)).toBe(false);
    expect(shouldBlip([g('c')], 170, 100)).toBe(true);
    expect(shouldBlip([g(' '), g('.')], 500, 100)).toBe(false);
  });
});

describe('confirm handling (one press = one action)', () => {
  const later = CONFIRM_COOLDOWN_MS + 1;

  it('first press while typing reveals, next press advances', () => {
    expect(resolveConfirm({ typingDone: false, repeat: false, msSinceLastAction: later })).toBe(
      'reveal',
    );
    expect(resolveConfirm({ typingDone: true, repeat: false, msSinceLastAction: later })).toBe(
      'advance',
    );
  });

  it('ignores key repeat and double clicks', () => {
    expect(resolveConfirm({ typingDone: true, repeat: true, msSinceLastAction: later })).toBe(
      'ignore',
    );
    expect(resolveConfirm({ typingDone: true, repeat: false, msSinceLastAction: 30 })).toBe(
      'ignore',
    );
  });
});
