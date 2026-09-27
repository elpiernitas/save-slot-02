import { describe, expect, it } from 'vitest';
import { PORTRAITS } from '../content/portraits';
import { composePortrait, DEFAULT_EXPRESSION } from './portraits';

describe('portraits', () => {
  for (const def of Object.values(PORTRAITS)) {
    describe(def.id, () => {
      it('has a neutral expression and a rectangular base', () => {
        expect(def.expressions[DEFAULT_EXPRESSION]).toBeDefined();
        const width = def.base[0]!.length;
        expect(def.base.every((r) => r.length === width)).toBe(true);
      });

      it('only uses palette colours', () => {
        const used = new Set(
          [...def.base, ...Object.values(def.expressions).flat()].join('').replaceAll('.', ''),
        );
        for (const c of used) expect(def.palette[c], c).toBeDefined();
      });

      it('draws every expression differently, without changing the size', () => {
        const composed = Object.keys(def.expressions).map((e) =>
          composePortrait(def, e).join('\n'),
        );
        expect(new Set(composed).size).toBe(composed.length);
        for (const rows of composed) expect(rows.split('\n')).toHaveLength(def.base.length);
      });

      it('falls back to neutral for unknown expressions', () => {
        expect(composePortrait(def, 'hysterical')).toEqual(
          composePortrait(def, DEFAULT_EXPRESSION),
        );
      });
    });
  }
});

describe('archivist scene art', () => {
  it('has an "off" screen with no face pixels', () => {
    const def = PORTRAITS.archivist!;
    const off = composePortrait(def, 'off').join('');
    expect(off).not.toContain('e');
    expect(off).not.toContain('m');
    expect(composePortrait(def, 'neutral').join('')).toContain('e');
  });
});
