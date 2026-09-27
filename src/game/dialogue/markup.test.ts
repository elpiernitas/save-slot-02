import { describe, expect, it } from 'vitest';
import { parseMarkup, plainText } from './markup';

const plain = { em: false, shake: false, sys: false, pace: 1 };

describe('parseMarkup', () => {
  it('keeps plain text as one token', () => {
    expect(parseMarkup('Hola, LUIS.')).toEqual({
      tokens: [{ type: 'text', text: 'Hola, LUIS.', style: plain }],
      errors: [],
    });
  });

  it('parses styles, nesting and pauses', () => {
    const { tokens, errors } = parseMarkup(
      '¿[em]Qué [shake]coño[/shake][/em] has hecho?[pause=600]',
    );
    expect(errors).toEqual([]);
    expect(tokens).toEqual([
      { type: 'text', text: '¿', style: plain },
      { type: 'text', text: 'Qué ', style: { ...plain, em: true } },
      { type: 'text', text: 'coño', style: { ...plain, em: true, shake: true } },
      { type: 'text', text: ' has hecho?', style: plain },
      { type: 'pause', ms: 600 },
    ]);
  });

  it('supports system tone, pace and line breaks', () => {
    const { tokens } = parseMarkup('[sys][slow]A[/slow][/sys]\n[fast]b[/fast][pause]');
    expect(tokens).toEqual([
      { type: 'text', text: 'A', style: { ...plain, sys: true, pace: 2 } },
      { type: 'break' },
      { type: 'text', text: 'b', style: { ...plain, pace: 0.5 } },
      { type: 'pause', ms: 350 },
    ]);
  });

  it('renders unknown tags literally and reports them (no injection)', () => {
    const { tokens, errors } = parseMarkup('<b>[script]x[/script]');
    expect(plainText('<b>[script]x[/script]')).toBe('<b>[script]x[/script]');
    expect(tokens.every((t) => t.type === 'text')).toBe(true);
    expect(errors).toHaveLength(2);
  });

  it('reports unclosed, mismatched and out-of-range tags', () => {
    expect(parseMarkup('[em]hola').errors).toEqual(['Unclosed tag [em]']);
    expect(parseMarkup('[em]a[/sys]').errors[0]).toMatch(/Mismatched/);
    expect(parseMarkup('[pause=9999]').errors[0]).toMatch(/invalid tag/);
    expect(parseMarkup('a [b').errors[0]).toMatch(/invalid tag/);
  });

  it('escapes a literal bracket with [[', () => {
    expect(plainText('[[SYSTEM]')).toBe('[SYSTEM]');
  });
});
