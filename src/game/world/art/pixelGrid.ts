import type { PixelArt } from '../../content/sigils';

/**
 * Tiny helpers to *build* pixel art as data (one char = one pixel, `.` =
 * transparent). Everything here is deterministic and original; the result is
 * plain rows + palette, rendered by the canvas renderer.
 */
export class PixelGrid {
  readonly cells: string[][];
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.cells = Array.from({ length: h }, () => Array<string>(w).fill('.'));
  }

  set(x: number, y: number, c: string): this {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y]![x] = c;
    return this;
  }

  get(x: number, y: number): string {
    return this.cells[y]?.[x] ?? '.';
  }

  rect(x: number, y: number, w: number, h: number, c: string): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    return this;
  }

  /** Stamps rows (".": skip) at an offset. */
  stamp(rows: readonly string[], ox = 0, oy = 0): this {
    rows.forEach((row, j) => [...row].forEach((c, i) => c !== '.' && this.set(ox + i, oy + j, c)));
    return this;
  }

  /** Adds a 1px outline of `c` around every opaque pixel (4-neighbourhood). */
  outline(c = 'o'): this {
    const src = this.cells.map((r) => [...r]);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[y]![x] !== '.') continue;
        const n = [src[y - 1]?.[x], src[y + 1]?.[x], src[y]?.[x - 1], src[y]?.[x + 1]];
        if (n.some((v) => v !== undefined && v !== '.' && v !== c)) this.cells[y]![x] = c;
      }
    }
    return this;
  }

  mirrored(): PixelGrid {
    const g = new PixelGrid(this.w, this.h);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) g.set(this.w - 1 - x, y, this.get(x, y));
    return g;
  }

  toArt(palette: Readonly<Record<string, string>>): PixelArt {
    return { rows: this.cells.map((r) => r.join('')), palette };
  }
}

/** Deterministic hash → [0, 1) for procedural texture/noise. */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
