// Two tiny original pixel fonts for signage baked into the art.

// 3×5 caps, digits and a few symbols.
const SMALL = {
  A: ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'],
  B: ['XX.', 'X.X', 'XX.', 'X.X', 'XX.'],
  C: ['.XX', 'X..', 'X..', 'X..', '.XX'],
  D: ['XX.', 'X.X', 'X.X', 'X.X', 'XX.'],
  E: ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
  F: ['XXX', 'X..', 'XX.', 'X..', 'X..'],
  G: ['.XX', 'X..', 'X.X', 'X.X', '.XX'],
  H: ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'],
  I: ['XXX', '.X.', '.X.', '.X.', 'XXX'],
  J: ['..X', '..X', '..X', 'X.X', '.X.'],
  K: ['X.X', 'X.X', 'XX.', 'X.X', 'X.X'],
  L: ['X..', 'X..', 'X..', 'X..', 'XXX'],
  M: ['X.X', 'XXX', 'XXX', 'X.X', 'X.X'],
  N: ['XX.', 'X.X', 'X.X', 'X.X', 'X.X'],
  O: ['.X.', 'X.X', 'X.X', 'X.X', '.X.'],
  P: ['XX.', 'X.X', 'XX.', 'X..', 'X..'],
  Q: ['.X.', 'X.X', 'X.X', 'XX.', '.XX'],
  R: ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
  S: ['.XX', 'X..', '.X.', '..X', 'XX.'],
  T: ['XXX', '.X.', '.X.', '.X.', '.X.'],
  U: ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'],
  V: ['X.X', 'X.X', 'X.X', 'X.X', '.X.'],
  W: ['X.X', 'X.X', 'XXX', 'XXX', 'X.X'],
  X: ['X.X', 'X.X', '.X.', 'X.X', 'X.X'],
  Y: ['X.X', 'X.X', '.X.', '.X.', '.X.'],
  Z: ['XXX', '..X', '.X.', 'X..', 'XXX'],
  0: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  1: ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  2: ['XX.', '..X', '.X.', 'X..', 'XXX'],
  3: ['XX.', '..X', '.X.', '..X', 'XX.'],
  4: ['X.X', 'X.X', 'XXX', '..X', '..X'],
  5: ['XXX', 'X..', 'XX.', '..X', 'XX.'],
  6: ['.XX', 'X..', 'XXX', 'X.X', 'XXX'],
  7: ['XXX', '..X', '.X.', '.X.', '.X.'],
  8: ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'],
  9: ['XXX', 'X.X', 'XXX', '..X', 'XX.'],
  '.': ['...', '...', '...', '...', '.X.'],
  ':': ['...', '.X.', '...', '.X.', '...'],
  '-': ['...', '...', 'XXX', '...', '...'],
  '·': ['...', '...', '.X.', '...', '...'],
  '€': ['.XX', 'X..', 'XX.', 'X..', '.XX'],
  ' ': ['..', '..', '..', '..', '..'],
};

// 5×7 caps for the bar sign (only the letters it needs, plus a few spares).
const LARGE = {
  L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
  A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
  U: ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
};

function draw(canvas, font, text, x, y, color, shadow, scale = 1) {
  let cx = x;
  for (const ch of text) {
    const glyph = font[ch] ?? font[' '];
    glyph.forEach((row, j) =>
      [...row].forEach((c, i) => {
        if (c !== 'X') return;
        if (shadow)
          canvas.rect(cx + i * scale + scale, y + j * scale + scale, scale, scale, shadow);
        canvas.rect(cx + i * scale, y + j * scale, scale, scale, color);
      }),
    );
    cx += (glyph[0].length + 1) * scale;
  }
  return cx - x - scale;
}

export function textWidth(text, large = false, scale = 1) {
  const font = large ? LARGE : SMALL;
  let w = 0;
  for (const ch of text) w += (font[ch] ?? font[' '])[0].length + 1;
  return Math.max(0, w - 1) * scale;
}

export const smallText = (c, text, x, y, color, shadow) =>
  draw(c, SMALL, text, x, y, color, shadow);
export const largeText = (c, text, x, y, color, shadow, scale = 1) =>
  draw(c, LARGE, text, x, y, color, shadow, scale);
