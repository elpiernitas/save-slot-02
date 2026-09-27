// Background for the La Muralla street: the bar/café frontage and its
// terrace on an ordinary late afternoon in Cimavilla (Gijón).
//
// Scale: a 40×60 character ≈ 1.75 m → ~34 px per metre.
// Light: low sun from the west-south-west. Lit surfaces are warm, shadows are
// cool (blue-violet). The foreground street lies in the shadow of the
// building across the road (off camera); the terrace and the façade are in
// sun. Anything the player walks behind is a separate prop.
import { Canvas, bayer, cool, darken, lighten, mix, noise, warm } from './canvas.mjs';
import { largeText, smallText, textWidth } from './font.mjs';

const SHADOW = '#2b2a55';

const STYLES = {
  ochre: { wall: '#d9a257', trim: '#f2e3c2', base: '#9c8f80' },
  cream: { wall: '#ecdcb9', trim: '#fbf2de', base: '#a09584' },
  coral: { wall: '#d98468', trim: '#f5e6cf', base: '#978a7c' },
};

// ---------------------------------------------------------------- helpers

function textured(c, x, y, w, h, color, amount, seed) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const n = noise(i, j, seed);
      let col = color;
      if (n < amount) col = darken(color, 0.06);
      else if (n > 1 - amount * 0.5) col = lighten(color, 0.06);
      c.px(i, j, col);
    }
  }
}

/** Dithered tint over an area (lighting passes). */
function tint(c, x, y, w, h, color, density, alpha = 1, mask) {
  for (let j = Math.max(0, y); j < Math.min(c.h, y + h); j++) {
    for (let i = Math.max(0, x); i < Math.min(c.w, x + w); i++) {
      const d = typeof density === 'function' ? density(i, j) : density;
      if (d <= 0) continue;
      if (mask && !mask(i, j)) continue;
      if (bayer(i, j) < d) c.px(i, j, color, alpha);
    }
  }
}

function softEllipseShadow(c, cx, cy, rx, ry, strength = 0.6) {
  tint(
    c,
    Math.floor(cx - rx),
    Math.floor(cy - ry),
    Math.ceil(rx * 2) + 1,
    Math.ceil(ry * 2) + 1,
    SHADOW,
    (i, j) => {
      const dx = (i + 0.5 - cx) / rx;
      const dy = (j + 0.5 - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d > 1) return 0;
      return d < 0.6 ? strength : strength * 0.5;
    },
    0.42,
  );
}

// ---------------------------------------------------------------- façade pieces

/** French window with a small iron balcony (first floor, partly cropped). */
function upperWindow(c, x, y, w, h, style, { shutters, seed }) {
  c.rect(x - 3, y - 3, w + 6, h + 5, darken(style.trim, 0.12));
  c.rect(x - 2, y - 2, w + 4, h + 3, style.trim);
  c.vramp(x, y, w, h, '#9cc0cc', '#3e5467');
  c.rect(x + Math.floor(w / 2) - 1, y, 2, h, style.trim);
  for (let k = 0; k < h; k += 11) c.rect(x, y + k, w, 1, style.trim);
  for (let k = 0; k < h; k++) {
    const sx = x + 2 + Math.floor(k * 0.45);
    if (sx < x + w / 2 - 1) c.px(sx, y + k, '#eef6f4', 0.5);
  }
  // curtain + warm lamp glimpse inside
  if (noise(seed, 1) > 0.4) c.rect(x + 2, y + 2, 4, h - 4, '#efe4cf', 0.8);
  if (noise(seed, 2) > 0.55) c.rect(x + w - 8, y + h - 12, 5, 6, '#ffcf7a', 0.55);
  if (shutters) {
    for (const sx of [x - 11, x + w + 3]) {
      c.rect(sx, y - 2, 8, h + 3, shutters);
      for (let k = y; k < y + h; k += 3) c.rect(sx + 1, k, 6, 1, darken(shutters, 0.22));
      c.rect(sx, y - 2, 1, h + 3, lighten(shutters, 0.25));
    }
  }
  // balcony slab + railing with flower pots
  const by = y + h - 14;
  c.rect(x - 8, by + 14, w + 16, 4, '#d6cebf').rect(
    x - 8,
    by + 18,
    w + 16,
    2,
    cool('#8a8276', 0.3),
  );
  c.rect(x - 8, by, w + 16, 1, '#2b2932');
  for (let k = x - 8; k < x + w + 8; k += 3) c.rect(k, by, 1, 14, '#2b2932');
  c.rect(x - 8, by + 7, w + 16, 1, '#2b2932');
  for (let k = 0; k < 2; k++) {
    const px = x - 4 + Math.floor(noise(seed, k + 5) * (w - 2));
    c.rect(px, by + 9, 7, 5, '#b8653e').rect(px, by + 9, 7, 1, lighten('#b8653e', 0.3));
    c.ellipse(px + 3.5, by + 7, 5, 3.5, '#4f7d3f');
    for (let f = 0; f < 4; f++)
      c.px(px + 1 + f * 2, by + 5 + (f % 2), ['#e04a3f', '#f28a3a', '#e04a3f', '#f6d35b'][f]);
  }
}

/** White glazed gallery (mirador), very Asturian. */
function gallery(c, x, y, w, h) {
  const frame = '#f7f2e8';
  c.rect(x - 4, y - 4, w + 8, h + 12, darken(frame, 0.12));
  c.rect(x - 3, y - 3, w + 6, h + 9, frame);
  const panes = Math.round(w / 14);
  const pw = Math.floor((w - (panes - 1) * 2) / panes);
  for (let k = 0; k < panes; k++) {
    const px = x + k * (pw + 2);
    c.vramp(px, y, pw, h - 12, '#a8c6ce', '#4a6275');
    c.rect(px, y + 10, pw, 1, frame);
    c.px(px + 2, y + 2, '#eef6f4')
      .px(px + 3, y + 3, '#eef6f4')
      .px(px + 4, y + 4, '#eef6f4');
    c.rect(px, y + h - 11, pw, 10, lighten(frame, 0.1)).rect(
      px,
      y + h - 11,
      pw,
      1,
      darken(frame, 0.25),
    );
  }
  c.rect(x - 4, y + h + 6, w + 8, 3, cool(darken(frame, 0.35), 0.3));
}

function floorBand(c, x, w, y, style) {
  c.rect(x, y, w, 8, style.trim);
  c.rect(x, y, w, 1, lighten(style.trim, 0.3));
  c.rect(x, y + 7, w, 1, cool(darken(style.trim, 0.4), 0.3));
  c.rect(x, y + 8, w, 3, cool(darken(style.wall, 0.25), 0.35)); // band shadow
}

function stonePlinth(c, x, w, top, bottom, style) {
  textured(c, x, top, w, bottom - top, style.base, 0.2, 7);
  for (let j = top + 9; j < bottom; j += 11) c.rect(x, j, w, 1, darken(style.base, 0.2));
  for (let j = top; j < bottom; j += 11) {
    const off = ((j - top) / 11) % 2 ? 0 : 13;
    for (let i = x + off; i < x + w; i += 26) c.rect(i, j, 1, 10, darken(style.base, 0.18));
  }
}

/** Residential entrance: recessed wooden double door with a fanlight. */
function portal(c, d, number, style) {
  const top = 70;
  const bottom = 152;
  const wood = '#6a3e28';
  c.rect(d.x - 8, top - 8, d.w + 16, bottom - top + 8, lighten(style.base, 0.2));
  c.rect(d.x - 8, top - 8, d.w + 16, 2, lighten(style.base, 0.45));
  c.rect(d.x - 4, top - 4, d.w + 8, bottom - top + 4, cool(darken(style.base, 0.35), 0.3)); // reveal
  c.rect(d.x, top, d.w, bottom - top, wood);
  c.vramp(d.x + 3, top + 2, d.w - 6, 12, '#8fb0bd', '#3f5364'); // fanlight
  for (let k = d.x + 5; k < d.x + d.w - 3; k += 5) c.rect(k, top + 2, 1, 12, '#2b2932');
  const leaf = Math.floor(d.w / 2);
  for (const lx of [d.x + 2, d.x + leaf + 1]) {
    c.rect(lx, top + 17, leaf - 3, 30, darken(wood, 0.15));
    c.rect(lx + 2, top + 19, leaf - 7, 26, lighten(wood, 0.1));
    c.rect(lx + 2, top + 19, 1, 26, lighten(wood, 0.25));
    c.rect(lx, top + 50, leaf - 3, 28, darken(wood, 0.15));
    c.rect(lx + 2, top + 52, leaf - 7, 24, lighten(wood, 0.06));
  }
  c.rect(d.x + leaf - 3, top + 46, 2, 4, '#d9b458').rect(d.x + leaf + 2, top + 46, 2, 4, '#d9b458');
  // number plaque + intercom
  c.rect(d.x + d.w + 10, top + 6, 11, 11, '#2f4a6e').rect(
    d.x + d.w + 10,
    top + 6,
    11,
    1,
    '#5b7ba3',
  );
  smallText(c, number, d.x + d.w + 14, top + 9, '#f4e6d0');
  c.rect(d.x + d.w + 11, top + 24, 9, 20, '#b8b2a8').rect(
    d.x + d.w + 12,
    top + 25,
    7,
    3,
    '#3a3a40',
  );
  for (let k = 0; k < 4; k++) c.rect(d.x + d.w + 13, top + 30 + k * 3, 5, 2, '#e8e2d8');
  c.rect(d.x - 6, bottom - 3, d.w + 12, 3, '#cfc4b2'); // step
}

/** Ground-floor window with a wrought-iron grille and a plant. */
function grilleWindow(c, win, style) {
  const y = 86;
  const h = 44;
  const { x, w } = win;
  c.rect(x - 4, y - 4, w + 8, h + 8, lighten(style.base, 0.25));
  c.vramp(x, y, w, h, '#88a8b4', '#33485a');
  c.rect(x + 3, y + 3, 7, h - 6, '#eadfca', 0.65);
  for (let k = x + 4; k < x + w; k += 6) c.rect(k, y - 2, 1, h + 4, '#27252d');
  c.rect(x - 2, y + 12, w + 4, 1, '#27252d').rect(x - 2, y + h - 12, w + 4, 1, '#27252d');
  for (let k = x + 4; k < x + w; k += 6) c.px(k, y - 3, '#3a3844');
  c.rect(x - 6, y + h + 3, w + 12, 3, lighten(style.trim, 0.1));
  // flower box
  c.rect(x - 2, y + h - 6, w + 4, 8, '#8a5a3a').rect(
    x - 2,
    y + h - 6,
    w + 4,
    1,
    lighten('#8a5a3a', 0.3),
  );
  for (let k = x; k < x + w; k += 5) {
    c.ellipse(k + 2, y + h - 8, 3.5, 3, Math.floor(k / 5) % 2 ? '#4f7d3f' : '#3f6a36');
    c.px(k + 2, y + h - 10, ['#e04a3f', '#f28a3a', '#f6d35b'][Math.floor(k / 5) % 3]);
  }
}

function wallLamp(c, x, y) {
  c.rect(x, y, 3, 3, '#2a2a30').rect(x - 2, y + 3, 7, 9, '#2a2a30');
  c.rect(x - 1, y + 4, 5, 7, '#ffe19a').rect(x, y + 5, 3, 5, '#fff3c8');
  for (let r = 14; r > 4; r -= 3) c.ellipse(x + 1.5, y + 8, r, r * 0.8, '#ffd88a', 0.05);
}

// ---------------------------------------------------------------- the bar

function barFrontage(c, L) {
  const b = L.buildings.find((it) => it.id === 'bar');
  const green = '#2b5646';
  const gold = '#d8b25a';
  const x0 = b.x + 10;
  const x1 = b.x + b.w - 10;
  const top = 54;
  // wooden frontage body
  c.rect(x0, top, x1 - x0, 152 - top, green);
  c.rect(x0, top, x1 - x0, 1, lighten(green, 0.35));
  for (const px of [x0, x1 - 6])
    c.rect(px, top, 6, 152 - top, darken(green, 0.2)).rect(
      px,
      top,
      1,
      152 - top,
      lighten(green, 0.2),
    );
  // fascia with the big name
  c.rect(x0 + 8, top + 3, x1 - x0 - 16, 22, darken(green, 0.3));
  c.rect(x0 + 8, top + 3, x1 - x0 - 16, 1, gold).rect(x0 + 8, top + 24, x1 - x0 - 16, 1, gold);
  const name = 'LA MURALLA';
  const nw = textWidth(name, true, 2);
  largeText(c, name, Math.round((x0 + x1) / 2 - nw / 2), top + 7, '#f7e6b0', '#10261d', 2);
  smallText(c, 'CAFE', x0 + 16, top + 12, lighten(gold, 0.35));
  smallText(c, 'BAR', x1 - 16 - textWidth('BAR'), top + 12, lighten(gold, 0.35));
  // gooseneck lamps over the fascia
  for (const lx of [x0 + 60, (x0 + x1) / 2, x1 - 60]) {
    c.rect(lx - 1, top - 6, 2, 5, '#2a2a30').rect(lx - 4, top - 2, 9, 3, '#2a2a30');
    c.rect(lx - 3, top + 1, 7, 1, '#ffe7a8');
    for (let r = 12; r > 3; r -= 3) c.ellipse(lx, top + 6, r, r * 0.6, '#ffe2a0', 0.06);
  }
  // shop windows with a deep, lived-in interior
  barWindow(c, L.barWindowLeft, green, gold, 11);
  barWindow(c, L.barWindowRight, green, gold, 23);
  barDoor(c, L.barDoor, green, gold);
  // awning over each window: cream canvas with green stripes, projecting out
  for (const win of [L.barWindowLeft, L.barWindowRight]) awning(c, win.x - 6, win.w + 12, top + 27);
  // skirting + flower boxes under the windows
  c.rect(x0, 146, x1 - x0, 6, darken(green, 0.4));
  for (const win of [L.barWindowLeft, L.barWindowRight]) {
    c.rect(win.x, 138, win.w, 8, '#6d4a30').rect(win.x, 138, win.w, 1, lighten('#6d4a30', 0.3));
    for (let k = win.x + 2; k < win.x + win.w - 2; k += 4) {
      c.ellipse(k + 2, 136, 3.2, 3, noise(k, 1, 4) > 0.5 ? '#4f7d3f' : '#5f9048');
      if (noise(k, 2, 4) > 0.45) c.px(k + 2, 134, noise(k, 3, 4) > 0.5 ? '#e8453c' : '#f7f1e6');
    }
  }
}

function awning(c, x, w, y) {
  const h = 12;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const stripe = Math.floor(i / 8) % 2 === 0;
      let col = stripe ? '#f1e5c8' : '#2f6a54';
      col = mix(col, '#ffffff', ((h - j) / h) * 0.08);
      if (i > w * 0.7) col = cool(col, 0.12);
      c.px(x + i, y + j, col);
    }
  }
  // scalloped valance
  for (let i = 0; i < w; i++) {
    const stripe = Math.floor(i / 8) % 2 === 0;
    const drop = i % 8 < 6 ? 4 : 2;
    c.rect(x + i, y + h, 1, drop, stripe ? darken('#f1e5c8', 0.08) : darken('#2f6a54', 0.1));
  }
  c.rect(x, y, w, 1, darken('#2f6a54', 0.3));
  // shadow the awning casts on the glass
  tint(c, x + 4, y + h + 4, w - 4, 10, SHADOW, (i, j) => 0.55 - (j - y - h - 4) * 0.05, 0.4);
}

function barWindow(c, win, green, gold, seed) {
  const y = 90;
  const h = 46;
  const { x, w } = win;
  c.rect(x - 3, y - 3, w + 6, h + 6, darken(green, 0.3));
  // interior: warm back wall, shelves with bottles, counter, pendant lamps
  c.vramp(x, y, w, h, '#f6cf82', '#b57438');
  for (const sy of [y + 8, y + 17]) {
    c.rect(x, sy + 6, w, 2, '#6b3f26');
    for (let i = x + 2; i < x + w - 2; i += 3) {
      const tone = ['#3f7a4a', '#8c2f2a', '#e0b85a', '#2e4f6b', '#d9d2c2'][
        Math.floor(noise(i, sy, seed) * 5)
      ];
      const bh = 3 + Math.floor(noise(i, sy + 1, seed) * 3);
      c.rect(i, sy + 6 - bh, 2, bh, tone).px(i, sy + 5 - bh, darken(tone, 0.3));
    }
  }
  // pendant lamps with halos
  for (let k = 0; k < 3; k++) {
    const lx = x + Math.round(((k + 0.5) * w) / 3);
    c.rect(lx, y, 1, 6, '#3a2a22')
      .rect(lx - 3, y + 6, 7, 3, '#2a2a30')
      .rect(lx - 2, y + 9, 5, 1, '#fff2c0');
    c.ellipse(lx, y + 11, 10, 5, '#fff0b0', 0.18);
  }
  // counter and customers (anonymous silhouettes)
  c.rect(x, y + 30, w, 4, '#5a3522')
    .rect(x, y + 30, w, 1, '#8a5a3a')
    .rect(x, y + 34, w, h - 34, '#7a4a2c');
  const people = [
    [0.22, '#5a3c34', '#3a4f66'],
    [0.47, '#2e2428', '#8a3a36'],
    [0.7, '#6a4a2a', '#2f5a47'],
    [0.86, '#3a2c2a', '#c8a44a'],
  ];
  for (const [f, hair, shirt] of people) {
    if (noise(Math.floor(f * 10), seed, 9) < 0.2) continue;
    const px = x + Math.round(f * w);
    c.ellipse(px, y + 22, 4.5, 5, cool(hair, 0.15), 0.9);
    c.rect(px - 6, y + 26, 12, 8, cool(shirt, 0.15), 0.9);
  }
  // espresso machine on the counter
  c.rect(x + 8, y + 22, 16, 8, '#c9c3b8')
    .rect(x + 10, y + 24, 12, 3, '#3a3a40')
    .rect(x + 8, y + 22, 16, 1, '#f1ede6');
  // glazing bars + two soft reflections
  const bars = Math.max(2, Math.round(w / 48));
  for (let k = 1; k < bars; k++) c.rect(x + Math.round((w * k) / bars) - 1, y, 3, h, green);
  for (let k = 0; k < h; k++) {
    c.px(x + 6 + Math.floor(k * 0.7), y + k, '#fff6de', 0.3);
    c.px(x + 10 + Math.floor(k * 0.7), y + k, '#fff6de', 0.18);
    c.px(x + w - 30 + Math.floor(k * 0.7), y + k, '#fff6de', 0.15);
  }
  c.rect(x - 3, y + h + 3, w + 6, 2, gold);
}

function barDoor(c, d, green, gold) {
  const top = 84;
  // recess: deep side reveals make the doorway read as a real opening
  c.rect(d.x - 6, top - 4, d.w + 12, 152 - top + 4, darken(green, 0.45));
  c.rect(d.x - 6, top - 4, 5, 152 - top + 4, cool(darken(green, 0.25), 0.2));
  c.rect(d.x + d.w + 1, top - 4, 5, 152 - top + 4, cool(darken(green, 0.55), 0.3));
  c.rect(d.x, top, d.w, 152 - top, darken(green, 0.15));
  const leaf = Math.floor(d.w / 2);
  for (const lx of [d.x + 2, d.x + leaf + 1]) {
    c.vramp(lx, top + 3, leaf - 3, 42, '#f7d690', '#b87a3e');
    c.rect(lx, top + 47, leaf - 3, 18, green).rect(
      lx + 2,
      top + 49,
      leaf - 7,
      14,
      lighten(green, 0.08),
    );
  }
  c.rect(d.x + leaf - 3, top + 26, 1, 12, gold).rect(d.x + leaf + 2, top + 26, 1, 12, gold);
  // someone inside, just beyond the door
  c.ellipse(d.x + d.w - 12, top + 20, 4, 4.5, '#5a3a2e', 0.85).rect(
    d.x + d.w - 17,
    top + 24,
    10,
    18,
    '#7a3a34',
    0.8,
  );
  // OPEN card
  c.rect(d.x + 4, top + 8, 17, 7, '#fbf3e0').rect(d.x + 4, top + 8, 17, 1, '#e8dcc0');
  smallText(c, 'OPEN', d.x + 5, top + 9, '#b33a2e');
  // warm light spilling out on the threshold
  c.rect(d.x - 2, 149, d.w + 4, 3, '#d8cdb8');
}

// ---------------------------------------------------------------- buildings

function building(c, b) {
  const style = STYLES[b.style];
  textured(c, b.x, 0, b.w, 152, style.wall, 0.24, b.x + 3);
  // soft warm light falling from the west on each façade
  tint(c, b.x, 0, b.w, 152, '#ffd08a', (i) => 0.28 - ((i - b.x) / b.w) * 0.28, 0.25);
  floorBand(c, b.x, b.w, 44, style);
  c.rect(b.x, 0, 3, 152, cool(darken(style.wall, 0.3), 0.3)); // party wall
  return style;
}

function facades(c, L) {
  for (const b of L.buildings) {
    const style = building(c, b);
    if (b.id === 'west') {
      upperWindow(c, b.x + 40, -6, 30, 42, style, { shutters: '#3f6a5a', seed: 1 });
      upperWindow(c, b.x + 200, -6, 30, 42, style, { shutters: '#3f6a5a', seed: 2 });
      stonePlinth(c, b.x, b.w, 124, 152, style);
      portal(c, L.westDoor, '3', style);
      grilleWindow(c, L.westWindow, style);
      wallLamp(c, L.westDoor.x + L.westDoor.w + 30, 70);
    } else if (b.id === 'bar') {
      upperWindow(c, b.x + 30, -6, 28, 42, style, { seed: 3 });
      gallery(c, b.x + 110, -4, 180, 36);
      upperWindow(c, b.x + b.w - 58, -6, 28, 42, style, { seed: 4 });
      barFrontage(c, L);
    } else {
      upperWindow(c, b.x + 40, -6, 30, 42, style, { shutters: '#ede6d4', seed: 5 });
      upperWindow(c, b.x + 180, -6, 30, 42, style, { shutters: '#ede6d4', seed: 6 });
      stonePlinth(c, b.x, b.w, 124, 152, style);
      portal(c, L.eastDoor, '5', style);
      grilleWindow(c, L.eastWindow, style);
    }
  }
  // drainpipes at the party walls
  for (const b of L.buildings.slice(1)) {
    c.rect(b.x - 3, 0, 5, 150, '#6e6a72')
      .rect(b.x - 3, 0, 1, 150, '#a09ca6')
      .rect(b.x + 1, 0, 1, 150, cool('#4a4650', 0.3));
    for (let j = 20; j < 150; j += 38) c.rect(b.x - 4, j, 7, 2, '#57535b');
  }
  // contact shadow at the foot of the façades
  tint(c, 0, 146, c.w, 10, SHADOW, (i, j) => 0.6 - (j - 146) * 0.06, 0.45);
}

// ---------------------------------------------------------------- ground

function ground(c, L) {
  const top = 152;
  const bottom = L.curbTop;
  // sidewalk: big granite slabs along the façades
  for (let j = top; j < L.sidewalkBottom; j++) {
    for (let i = 0; i < c.w; i++) {
      const slab = Math.floor(i / 34) + Math.floor((j - top) / 15) * 31;
      const base = noise(slab, 7, 3) > 0.5 ? '#c9bca4' : '#bfb198';
      let col = noise(i, j, 8) > 0.94 ? darken(base, 0.06) : base;
      if (i % 34 === 0 || (j - top) % 15 === 0) col = '#9d907c';
      c.px(i, j, col);
    }
  }
  c.rect(0, L.sidewalkBottom - 3, c.w, 3, '#d8ccb6').rect(0, L.sidewalkBottom, c.w, 1, '#8a7e6c');
  // street: granite setts laid in gentle arcs, warm and varied
  const setts = [
    '#b9ab93',
    '#c9b99c',
    '#a39a8e',
    '#b5a386',
    '#cfbd9c',
    '#9c948a',
    '#bba888',
    '#aaa39a',
    '#c2a988',
  ];
  for (let j = L.sidewalkBottom + 1; j < bottom; j++) {
    for (let i = 0; i < c.w; i++) {
      // arc pattern: row index follows a shallow curve every 96 px
      const arc = Math.round(Math.pow(((i % 128) - 64) / 64, 2) * 3);
      const rj = j + arc;
      const row = Math.floor(rj / 7);
      const off = row % 2 ? 5 : 0;
      const col = Math.floor((i + off) / 10);
      const lx = (i + off) % 10;
      const ly = rj % 7;
      if (lx === 0 || ly === 0) {
        c.px(i, j, noise(i, j, 33) > 0.5 ? '#978b7a' : '#a09482');
        continue;
      }
      let tone = setts[Math.floor(noise(col, row, 31) * setts.length)];
      if (ly === 1 || lx === 1) tone = lighten(tone, 0.08);
      else if (ly === 6) tone = darken(tone, 0.07);
      if (noise(i, j, 32) > 0.97) tone = darken(tone, 0.1);
      c.px(i, j, tone);
    }
  }
  // worn granite strip (drain) along the street, and a manhole cover
  const dy = 372;
  c.rect(0, dy, c.w, 7, '#a3978a')
    .rect(0, dy, c.w, 1, '#d6ccbb')
    .rect(0, dy + 6, c.w, 1, '#7c7064');
  for (let i = 6; i < c.w; i += 22) c.rect(i, dy + 2, 12, 3, '#8b7f70');
  c.ellipse(610, 348, 13, 6, '#4a464e').ellipse(610, 348, 11, 5, '#5c5862');
  for (let k = -9; k <= 9; k += 3) c.rect(610 + k, 345, 1, 7, '#3a373f');
  // curb and road edge at the very bottom
  c.rect(0, bottom, c.w, 3, '#e0d6c4').rect(0, bottom + 3, c.w, c.h - bottom - 3, '#5a5660');
}

// ---------------------------------------------------------------- lighting

function treeGrate(c, x, y) {
  c.rect(x - 18, y - 8, 36, 16, '#3e3a40').rect(x - 18, y - 8, 36, 1, '#6a6570');
  for (let k = -15; k <= 15; k += 3) c.rect(x + k, y - 6, 1, 13, '#262328');
  c.rect(x - 6, y - 5, 12, 10, '#5a4530');
}

function lighting(c, L) {
  // warm glow from the bar spilling onto the sidewalk and terrace floor
  for (const win of [L.barWindowLeft, L.barDoor, L.barWindowRight]) {
    tint(c, win.x - 6, 152, win.w + 12, 34, '#ffc978', (i, j) => 0.42 - (j - 152) * 0.012, 0.28);
  }
  // long late-afternoon shadows (sun low in the west → shadows lean east)
  for (const t of L.trees) {
    treeGrate(c, t.x, t.y);
    softEllipseShadow(c, t.x + 80, t.y - 20, 110, 26, 0.62);
  }
  for (const t of L.tables) {
    softEllipseShadow(c, t.x + 16, t.y - 2, t.umbrella ? 62 : 28, t.umbrella ? 16 : 7, 0.55);
  }
  const tr = L.terrace;
  for (let x = tr.x; x < tr.x + tr.w; x++) {
    if (x >= tr.gapX && x < tr.gapX + tr.gapW) continue;
    for (let j = 1; j <= 5; j++) c.px(x + 6, tr.y + tr.h + j, SHADOW, 0.14);
  }
  softEllipseShadow(c, L.board.x + 10, L.board.y, 14, 4, 0.6);
  softEllipseShadow(c, L.bench.x + 14, L.bench.y, 34, 6, 0.55);
  softEllipseShadow(c, L.bike.x + 10, L.bike.y, 30, 5, 0.5);
  for (const p of L.planters) softEllipseShadow(c, p.x + 6, p.y, 13, 4, 0.55);
  for (const b of L.bollards) softEllipseShadow(c, b.x + 10, b.y, 12, 3, 0.6);
  // the building across the street (off camera) shades the foreground:
  // a cool, dithered band with a slanted edge
  tint(
    c,
    0,
    300,
    c.w,
    c.h - 300,
    SHADOW,
    (i, j) => {
      const edge = 318 + (i / c.w) * 34; // slants down to the east
      if (j < edge) return 0;
      return Math.min(0.62, (j - edge) / 28 + 0.3);
    },
    0.32,
  );
  // late sun raking across the terrace floor (warm)
  tint(c, 300, 182, 420, 120, '#ffd08a', (i, j) => (j > 190 && j < 296 ? 0.22 : 0), 0.22);
  // fallen leaves near the trees
  for (const t of L.trees) {
    for (let k = 0; k < 40; k++) {
      const lx = t.x - 70 + Math.floor(noise(k, t.x, 71) * 150);
      const ly = t.y - 30 + Math.floor(noise(k, t.y, 72) * 50);
      c.px(lx, ly, ['#c8742e', '#d9a23a', '#9a5a2a', '#7f8a3a'][k % 4]);
    }
  }
}

export function drawBackground(L) {
  const c = new Canvas(L.widthTiles * L.tile, L.heightTiles * L.tile);
  facades(c, L);
  ground(c, L);
  lighting(c, L);
  return c;
}

/**
 * Foreground layer (drawn over sprites): out-of-focus foliage and a lamp post
 * in the near corners, to separate the foreground from the play space.
 */
export function drawForeground(L) {
  const c = new Canvas(L.widthTiles * L.tile, L.heightTiles * L.tile);
  const leaf = ['#1d3326', '#24402c', '#2c4c32', '#355a38'];
  const bush = (cx, cy, rx, ry, seed) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1 - noise(x, y, seed) * 0.35) continue;
        const k = Math.max(
          0,
          Math.min(3, Math.round(1.5 - dy * 1.2 - dx * 0.5 + (bayer(x, y) - 0.5))),
        );
        c.px(x, y, leaf[k]);
      }
    }
  };
  // bottom-left: a planter hedge right in front of the camera
  bush(18, 404, 64, 26, 81);
  bush(70, 410, 40, 18, 82);
  // bottom-right: foliage from a tree just off screen
  bush(952, 398, 60, 30, 83);
  bush(900, 412, 34, 16, 84);
  // warm rim light on the sun-facing leaves
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (c.alphaAt(x, y) && !c.alphaAt(x, y - 1) && noise(x, y, 85) > 0.4) c.px(x, y, '#6f8f4a');
    }
  }
  return c;
}
