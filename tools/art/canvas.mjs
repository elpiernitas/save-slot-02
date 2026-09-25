// Tiny pixel canvas used to author the world art. Everything is deterministic.

export function hex(color) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a, b, t) {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const c = (x, y) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

export const darken = (c, t) => mix(c, '#140f1c', t);
export const lighten = (c, t) => mix(c, '#fff4dc', t);

/** Deterministic hash → [0, 1). */
export function noise(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2654435761) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
/** Ordered-dither threshold in [0, 1). */
export const bayer = (x, y) => (BAYER[y & 3][x & 3] + 0.5) / 16;

export class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  /** Alpha-composites a colour onto the pixel. */
  px(x, y, color, alpha = 1) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || alpha <= 0) return this;
    const i = (y * this.w + x) * 4;
    const [r, g, b] = hex(color);
    const a0 = this.data[i + 3] / 255;
    const a = alpha + a0 * (1 - alpha);
    if (a === 0) return this;
    this.data[i] = (r * alpha + this.data[i] * a0 * (1 - alpha)) / a;
    this.data[i + 1] = (g * alpha + this.data[i + 1] * a0 * (1 - alpha)) / a;
    this.data[i + 2] = (b * alpha + this.data[i + 2] * a0 * (1 - alpha)) / a;
    this.data[i + 3] = a * 255;
    return this;
  }

  alphaAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }

  colorAt(x, y) {
    const i = (y * this.w + x) * 4;
    const h = (v) => v.toString(16).padStart(2, '0');
    return `#${h(this.data[i])}${h(this.data[i + 1])}${h(this.data[i + 2])}`;
  }

  rect(x, y, w, h, color, alpha = 1) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, color, alpha);
    return this;
  }

  /** Vertical ramp between two colours, dithered (no smooth gradients). */
  vramp(x, y, w, h, top, bottom, alpha = 1) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const t = h <= 1 ? 0 : j / (h - 1);
        const steps = 4;
        const q = Math.floor(t * steps + bayer(x + i, y + j)) / steps;
        this.px(x + i, y + j, mix(top, bottom, Math.min(1, q)), alpha);
      }
    }
    return this;
  }

  ellipse(cx, cy, rx, ry, color, alpha = 1) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, color, alpha);
      }
    }
    return this;
  }

  line(x0, y0, x1, y1, color, alpha = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= steps; s++)
      this.px(x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps, color, alpha);
    return this;
  }

  /**
   * Selective outline: transparent pixels next to opaque ones get a darker
   * version of that neighbour (modern pixel art, no flat black outlines).
   */
  outline(amount = 0.55) {
    const src = new Uint8ClampedArray(this.data);
    const alphaAt = (x, y) =>
      x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : src[(y * this.w + x) * 4 + 3];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (alphaAt(x, y) > 0) continue;
        for (const [dx, dy] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ]) {
          if (alphaAt(x + dx, y + dy) > 200) {
            const i = ((y + dy) * this.w + x + dx) * 4;
            const h = (v) => v.toString(16).padStart(2, '0');
            this.px(x, y, darken(`#${h(src[i])}${h(src[i + 1])}${h(src[i + 2])}`, amount));
            break;
          }
        }
      }
    }
    return this;
  }

  blit(src, ox, oy, { flipX = false } = {}) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const sx = flipX ? src.w - 1 - x : x;
        const a = src.alphaAt(sx, y);
        if (a > 0) this.px(ox + x, oy + y, src.colorAt(sx, y), a / 255);
      }
    }
    return this;
  }
}
