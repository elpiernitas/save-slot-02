import { describe, expect, it } from 'vitest';
import type { PixelArt } from '../../content/sigils';
import {
  buildCharacter,
  CHARACTER_H,
  CHARACTER_W,
  PLAYER_STYLE,
  WAITRESS_STYLE,
} from './characters';
import { ANIMATED_ART, PROP_ART } from './props';
import { MURALLA_MAP } from '../maps/muralla';

const usesOnlyPalette = (art: PixelArt) => {
  const used = new Set(art.rows.join('').replaceAll('.', ''));
  return [...used].every((c) => art.palette[c] !== undefined);
};

describe('world art (original pixel data)', () => {
  it.each([
    ['player', PLAYER_STYLE],
    ['waitress', WAITRESS_STYLE],
  ] as const)('%s has 4 directions × 3 frames at 16×24', (_name, style) => {
    const frames = buildCharacter(style);
    expect(Object.keys(frames)).toHaveLength(12);
    for (const art of Object.values(frames)) {
      expect(art.rows).toHaveLength(CHARACTER_H);
      expect(art.rows.every((r) => r.length === CHARACTER_W)).toBe(true);
      expect(usesOnlyPalette(art)).toBe(true);
    }
  });

  it('walk frames differ from idle; left mirrors right', () => {
    const f = buildCharacter(PLAYER_STYLE);
    expect(f.down_1!.rows).not.toEqual(f.down_0!.rows);
    expect(f.left_0!.rows).toEqual(f.right_0!.rows.map((r) => [...r].reverse().join('')));
  });

  it('the provisional player wears the canon white top with a black heart', () => {
    const front = buildCharacter(PLAYER_STYLE).down_0!.rows.join('');
    expect(front).toContain('k'); // heart
    expect(PLAYER_STYLE.palette.w).toBe('#f4f1ea');
  });

  it('every prop the map uses exists and only uses its palette', () => {
    for (const art of [...Object.values(PROP_ART), ...Object.values(ANIMATED_ART).flat()]) {
      expect(usesOnlyPalette(art)).toBe(true);
    }
    for (const prop of MURALLA_MAP.props) expect(PROP_ART[prop.sprite], prop.sprite).toBeDefined();
  });
});
