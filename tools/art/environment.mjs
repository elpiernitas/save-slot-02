// Background for the La Muralla street (bar/café frontage + terrace street).
// Warm late-afternoon light from the west. Everything that the player can walk
// behind is a separate prop; this image only holds flat or wall-bound things.
import { Canvas, bayer, darken, lighten, mix, noise } from './canvas.mjs';
import { largeText, smallText, textWidth } from './font.mjs';

const INK = '#241c26';

const STYLES = {
  ochre: { wall: '#d6a25b', trim: '#f0e2c4', base: '#9a8f82' },
  cream: { wall: '#e8d9b8', trim: '#fbf3e0', base: '#9a948a' },
  coral: { wall: '#d98a6c', trim: '#f4e6d0', base: '#968b80' },
};

// Vertical geometry of the façades (world px).
const CORNICE = 10;
const FLOOR_LINE = 92;
const GROUND_TOP = 96;

function textured(c, x, y, w, h, color, amount, seed) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const n = noise(i, j, seed);
      let col = color;
      if (n < amount) col = darken(color, 0.07);
      else if (n > 1 - amount * 0.6) col = lighten(color, 0.06);
      c.px(i, j, col);
    }
  }
}

/** Warm light from the west: gentle dithered falloff to the east of a wall. */
function westLight(c, x, w, y, h, strength) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const t = (i - x) / Math.max(1, w - 1);
      if (bayer(i, j) < t * strength) c.px(i, j, '#5a3a4a', 0.12);
    }
  }
}

function upperWindow(c, x, y, w, h, trim, { balcony = false, shutters = null, seed = 0 } = {}) {
  // reveal + frame
  c.rect(x - 2, y - 2, w + 4, h + 4, darken(trim, 0.1));
  c.rect(x - 1, y - 1, w + 2, h + 2, trim);
  // glass: cool evening sky reflection, darker at the bottom
  c.vramp(x, y, w, h, '#8fb3bf', '#3f5467');
  c.rect(x + Math.floor(w / 2), y, 1, h, trim); // mullion
  c.rect(x, y + Math.floor(h * 0.38), w, 1, trim); // transom
  // diagonal reflection streak
  for (let k = 0; k < h; k++) {
    const sx = x + 2 + Math.floor(k * 0.5) - 3;
    if (sx >= x && sx < x + Math.floor(w / 2)) c.px(sx, y + k, lighten('#a9c7cf', 0.4), 0.55);
  }
  // curtain peeking
  if (noise(seed, 3) > 0.4) c.rect(x + 1, y + 1, 3, h - 2, '#e9e2d0', 0.7);
  // sill
  c.rect(x - 3, y + h + 1, w + 6, 2, lighten(trim, 0.2)).rect(
    x - 3,
    y + h + 3,
    w + 6,
    1,
    darken(trim, 0.35),
  );
  if (shutters) {
    for (const sx of [x - 8, x + w + 2]) {
      c.rect(sx, y - 1, 6, h + 2, shutters);
      for (let k = y; k < y + h; k += 3) c.rect(sx + 1, k, 4, 1, darken(shutters, 0.25));
      c.rect(sx, y - 1, 1, h + 2, lighten(shutters, 0.2));
    }
  }
  if (balcony) {
    const by = y + h - 10;
    c.rect(x - 6, by + 12, w + 12, 3, '#cfc6b8').rect(
      x - 6,
      by + 15,
      w + 12,
      1,
      darken('#cfc6b8', 0.4),
    );
    c.rect(x - 6, by, w + 12, 1, '#2d2a33');
    for (let k = x - 6; k < x + w + 6; k += 3) c.rect(k, by, 1, 12, '#2d2a33');
    c.rect(x - 6, by + 6, w + 12, 1, '#2d2a33', 0.6);
    // a potted geranium on the balcony
    if (noise(seed, 9) > 0.35) {
      const px = x + Math.floor(noise(seed, 5) * (w - 6));
      c.rect(px, by + 8, 6, 4, '#b8653e');
      c.ellipse(px + 3, by + 6, 4, 3, '#4f7a3f')
        .px(px + 2, by + 5, '#d8483f')
        .px(px + 4, by + 4, '#d8483f');
    }
  }
}

/** White glazed gallery ("mirador"): very Asturian, very everyday. */
function gallery(c, x, y, w, h) {
  const frame = '#f7f2e8';
  c.rect(x - 3, y - 4, w + 6, h + 10, darken(frame, 0.12));
  c.rect(x - 2, y - 3, w + 4, h + 8, frame);
  const panes = Math.round(w / 12);
  const pw = Math.floor((w - (panes - 1)) / panes);
  for (let k = 0; k < panes; k++) {
    const px = x + k * (pw + 1);
    c.vramp(px, y, pw, h - 10, '#a3c1c9', '#4a6072');
    c.rect(px, y + 9, pw, 1, frame);
    c.px(px + 2, y + 2, '#e8f2f0').px(px + 3, y + 3, '#e8f2f0');
    c.rect(px, y + h - 9, pw, 8, lighten(frame, 0.1)).rect(
      px,
      y + h - 9,
      pw,
      1,
      darken(frame, 0.2),
    );
  }
  c.rect(x - 3, y + h + 5, w + 6, 2, darken(frame, 0.35));
}

function cornice(c, x, w, style) {
  c.rect(x, 0, w, CORNICE, darken(style.wall, 0.18));
  c.rect(x, CORNICE - 3, w, 2, style.trim).rect(x, CORNICE - 1, w, 1, darken(style.trim, 0.4));
  for (let i = x + 2; i < x + w; i += 6) c.rect(i, CORNICE - 6, 3, 3, darken(style.wall, 0.3));
}

function floorLine(c, x, w, style) {
  c.rect(x, FLOOR_LINE, w, 4, style.trim);
  c.rect(x, FLOOR_LINE + 3, w, 1, darken(style.trim, 0.45));
}

function stoneBase(c, x, w, style, top = GROUND_TOP) {
  // granite pilasters/plinth of the ground floor
  textured(c, x, top, w, 160 - top, style.base, 0.18, 7);
  for (let j = top + 8; j < 160; j += 10) c.rect(x, j, w, 1, darken(style.base, 0.18));
}

function pilaster(c, x, w, style) {
  textured(c, x, GROUND_TOP, w, 64, lighten(style.base, 0.12), 0.16, 11);
  c.rect(x, GROUND_TOP, 1, 64, lighten(style.base, 0.35));
  c.rect(x + w - 1, GROUND_TOP, 1, 64, darken(style.base, 0.35));
  for (let j = GROUND_TOP + 12; j < 160; j += 13) c.rect(x, j, w, 1, darken(style.base, 0.2));
}

// ---------------------------------------------------------------- bar

function barFrontage(c, L) {
  const b = L.buildings.find((it) => it.id === 'bar');
  const green = '#2f5a47';
  const gold = '#d4ae55';
  const x0 = b.x + 8;
  const x1 = b.x + b.w - 8;
  // wooden frontage body
  c.rect(x0, GROUND_TOP - 2, x1 - x0, 66, green);
  c.rect(x0, GROUND_TOP - 2, x1 - x0, 1, lighten(green, 0.3));
  // fascia with the name
  const fy = GROUND_TOP;
  c.rect(x0 + 4, fy, x1 - x0 - 8, 14, darken(green, 0.25));
  c.rect(x0 + 4, fy, x1 - x0 - 8, 1, gold).rect(x0 + 4, fy + 13, x1 - x0 - 8, 1, gold);
  const name = 'LA MURALLA';
  const nw = textWidth(name, true);
  const nx = Math.round((x0 + x1) / 2 - nw / 2);
  largeText(c, name, nx, fy + 4, '#f6e3a8', darken(green, 0.6));
  // tiny "CAFE BAR" plaques either side
  smallText(c, 'CAFE', x0 + 10, fy + 5, lighten(gold, 0.3));
  smallText(c, 'BAR', x1 - 10 - textWidth('BAR'), fy + 5, lighten(gold, 0.3));
  // wall lamps
  for (const lx of [L.barWindowLeft.x - 6, L.barWindowRight.x + L.barWindowRight.w + 3]) {
    c.rect(lx, fy + 16, 3, 2, '#2a2a2f').rect(lx - 1, fy + 18, 5, 6, '#2a2a2f');
    c.rect(lx, fy + 19, 3, 4, '#ffd98a');
    c.ellipse(lx + 1.5, fy + 21, 9, 7, '#ffd98a', 0.1);
  }
  // shop windows with a warm interior
  for (const win of [L.barWindowLeft, L.barWindowRight])
    barWindow(c, win.x, fy + 18, win.w, 38, green, gold);
  // door
  barDoor(c, L.barDoor.x, fy + 16, L.barDoor.w, 48, green, gold);
  // skirting
  c.rect(x0, 156, x1 - x0, 4, darken(green, 0.35));
}

function barWindow(c, x, y, w, h, green, gold) {
  c.rect(x - 2, y - 2, w + 4, h + 4, darken(green, 0.3));
  // interior: warm wall, back shelf with bottles, counter, a hanging lamp
  c.vramp(x, y, w, h, '#f1c77a', '#b9793f');
  c.rect(x, y + 10, w, 2, '#6b4028');
  for (let i = x + 2; i < x + w - 2; i += 4) {
    const tone = ['#3f7a4a', '#8c2f2a', '#d9b25a', '#2e4f6b'][Math.floor(noise(i, y, 3) * 4)];
    c.rect(i, y + 5, 2, 5, tone).px(i, y + 4, darken(tone, 0.3));
  }
  c.rect(x, y + 24, w, 3, '#5a3522').rect(x, y + 27, w, h - 27, '#7a4a2c');
  // cups and a coffee machine silhouette on the counter
  c.rect(x + 6, y + 17, 12, 7, '#c9c3b8').rect(x + 8, y + 19, 8, 2, '#3a3a40');
  c.rect(x + w - 16, y + 21, 3, 3, '#f4eee2').rect(x + w - 11, y + 21, 3, 3, '#f4eee2');
  // silhouettes of people inside (anonymous)
  for (const [ox, tone] of [
    [Math.floor(w * 0.45), '#6a4a3a'],
    [Math.floor(w * 0.68), '#4a3a44'],
  ]) {
    c.ellipse(x + ox, y + 17, 4, 4.5, tone, 0.8);
    c.rect(x + ox - 5, y + 21, 10, 8, tone, 0.8);
  }
  // glazing bars and reflections
  const bars = Math.max(2, Math.round(w / 36));
  for (let k = 1; k < bars; k++) c.rect(x + Math.round((w * k) / bars), y, 2, h, green);
  for (let k = 0; k < h; k++) {
    c.px(x + 4 + Math.floor(k * 0.6), y + k, '#fff6de', 0.35);
    c.px(x + 7 + Math.floor(k * 0.6), y + k, '#fff6de', 0.2);
  }
  c.rect(x - 2, y + h + 2, w + 4, 2, gold);
}

function barDoor(c, x, y, w, h, green, gold) {
  c.rect(x - 2, y - 2, w + 4, h + 2, darken(green, 0.35));
  c.rect(x, y, w, h, darken(green, 0.1));
  const leaf = Math.floor(w / 2);
  for (const lx of [x + 2, x + leaf + 1]) {
    c.vramp(lx, y + 3, leaf - 3, h - 18, '#f0c472', '#a8703e');
    c.rect(lx, y + h - 13, leaf - 3, 11, darken(green, 0.05));
    c.rect(lx + 2, y + h - 11, leaf - 7, 7, lighten(green, 0.08));
  }
  c.rect(x + leaf - 2, y + 20, 1, 8, gold).rect(x + leaf + 1, y + 20, 1, 8, gold);
  // "ABIERTO" sticker
  c.rect(x + 1, y + 6, 17, 7, '#fbf3e0');
  smallText(c, 'OPEN', x + 2, y + 7, '#a33b30');
  // threshold step
  c.rect(x - 4, 160 - 2, w + 8, 2, '#c9c0b0');
}

// ---------------------------------------------------------------- west + east

function shutterShop(c, L) {
  const s = L.shutter;
  const y = GROUND_TOP + 8;
  const h = 160 - y;
  c.rect(s.x - 3, y - 6, s.w + 6, 6, '#6e6a70'); // shutter box
  c.rect(s.x - 3, y - 6, s.w + 6, 1, '#9a96a0');
  for (let j = 0; j < h; j++) {
    const tone = j % 3 === 0 ? '#7d7a82' : j % 3 === 1 ? '#a19ea6' : '#908d96';
    c.rect(s.x, y + j, s.w, 1, tone);
  }
  westLight(c, s.x, s.w, y, h, 0.5);
  c.rect(s.x - 3, y, 3, h, '#5d5a62').rect(s.x + s.w, y, 3, h, '#5d5a62');
  // rust streaks and a padlock at the bottom
  for (const rx of [s.x + 70, s.x + 96])
    for (let k = 0; k < 14; k++) c.px(rx + (k % 2), y + 18 + k * 2, '#8a5a3a', 0.35);
  c.rect(s.x + Math.floor(s.w / 2) - 3, 160 - 9, 6, 5, '#c9a24a').rect(
    s.x + Math.floor(s.w / 2) - 2,
    160 - 12,
    4,
    3,
    '#6e6a70',
  );
  // taped paper note
  const nx = s.x + 18;
  const ny = y + 12;
  c.rect(nx, ny, 38, 18, '#f7f3e8').rect(nx + 1, ny + 18, 38, 1, '#5b5860');
  c.rect(nx + 14, ny - 2, 10, 3, '#e3d7a3', 0.85);
  smallText(c, 'VUELVO', nx + 3, ny + 3, INK);
  smallText(c, 'EN 5 MIN', nx + 3, ny + 10, INK);
  // sign over the shutter
  c.rect(s.x + 8, GROUND_TOP - 1, s.w - 16, 8, '#3a3a48');
  smallText(
    c,
    'MERCERIA',
    s.x + Math.round(s.w / 2 - textWidth('MERCERIA') / 2),
    GROUND_TOP + 1,
    '#e9e2d0',
  );
}

function portalDoor(c, L) {
  const p = L.portal;
  const y = GROUND_TOP + 6;
  const wood = '#6a3f2a';
  c.rect(p.x - 5, y - 5, p.w + 10, 160 - y + 5, lighten('#968b80', 0.25));
  c.rect(p.x - 5, y - 5, p.w + 10, 1, lighten('#968b80', 0.5));
  c.rect(p.x, y, p.w, 160 - y, wood);
  const leaf = Math.floor(p.w / 2);
  for (const lx of [p.x + 2, p.x + leaf + 1]) {
    c.rect(lx, y + 3, leaf - 3, 20, darken(wood, 0.25));
    c.vramp(lx + 2, y + 5, leaf - 7, 16, '#7fa0ad', '#3e5263');
    c.rect(lx + Math.floor((leaf - 3) / 2) - 1, y + 5, 1, 16, '#2d2a33');
    c.rect(lx, y + 27, leaf - 3, 22, darken(wood, 0.12));
    c.rect(lx + 2, y + 29, leaf - 7, 18, lighten(wood, 0.08));
  }
  c.rect(p.x + leaf - 3, y + 30, 2, 3, '#d4ae55').rect(p.x + leaf + 2, y + 30, 2, 3, '#d4ae55');
  // house number and the intercom panel
  c.rect(p.x + p.w + 7, y + 10, 8, 16, '#b9b3aa').rect(p.x + p.w + 8, y + 11, 6, 2, '#3a3a40');
  for (let k = 0; k < 4; k++) c.rect(p.x + p.w + 9, y + 15 + k * 3, 4, 2, '#e6e0d6');
  c.rect(p.x + p.w + 7, y + 30, 9, 9, '#2f4a6e').rect(p.x + p.w + 7, y + 30, 9, 1, '#5a7aa0');
  smallText(c, '7', p.x + p.w + 10, y + 32, '#f4e6d0');
  c.rect(p.x - 4, 158, p.w + 8, 2, '#c9c0b0');
}

function fruitShop(c, L) {
  const s = L.shopWindow;
  const y = GROUND_TOP + 12;
  const h = 160 - y - 6;
  const frame = '#3f5f7a';
  c.rect(s.x - 3, GROUND_TOP, s.w + 6, 9, frame);
  smallText(
    c,
    'FRUTAS · VERDURAS',
    s.x + Math.round(s.w / 2 - textWidth('FRUTAS · VERDURAS') / 2),
    GROUND_TOP + 2,
    '#f4e6d0',
  );
  c.rect(s.x - 3, y - 3, s.w + 6, h + 9, frame);
  c.vramp(s.x, y, s.w, h, '#f4dfb0', '#caa06a');
  // shelves of produce behind the glass
  const produce = ['#d8483f', '#f09a3a', '#e8d04a', '#6ea24a', '#8a3f6a'];
  for (let row = 0; row < 3; row++) {
    const ry = y + 8 + row * 13;
    c.rect(s.x, ry + 6, s.w, 2, '#7a5236');
    for (let i = s.x + 2; i < s.x + s.w - 4; i += 5) {
      const tone = produce[Math.floor(noise(i, ry, 13) * produce.length)];
      c.ellipse(i + 2, ry + 3, 2.4, 2.4, tone).px(i + 1, ry + 2, lighten(tone, 0.4));
    }
  }
  for (let k = 0; k < h; k++) c.px(s.x + 6 + Math.floor(k * 0.6), y + k, '#ffffff', 0.3);
  c.rect(s.x + Math.floor(s.w / 2), y, 2, h, frame);
  // produce crates on the sidewalk ledge
  for (let k = 0; k < 4; k++) {
    const cx = s.x + 6 + k * 29;
    c.rect(cx, 152, 24, 8, '#b98a52').rect(cx, 152, 24, 1, lighten('#b98a52', 0.3));
    c.rect(cx, 155, 24, 1, darken('#b98a52', 0.3));
    const tone = produce[k % produce.length];
    for (let i = 0; i < 5; i++) c.ellipse(cx + 3 + i * 4.5, 151, 2.4, 2, tone);
  }
}

function building(c, L, b) {
  const style = STYLES[b.style];
  textured(c, b.x, 0, b.w, GROUND_TOP, style.wall, 0.22, b.x);
  westLight(c, b.x, b.w, 0, GROUND_TOP, 0.35);
  cornice(c, b.x, b.w, style);
  floorLine(c, b.x, b.w, style);
  // party walls between buildings
  c.rect(b.x, 0, 2, 160, darken(style.wall, 0.35));
  stoneBase(c, b.x, b.w, style);
  return style;
}

function facades(c, L) {
  for (const b of L.buildings) {
    const style = building(c, L, b);
    if (b.id === 'west') {
      upperWindow(c, b.x + 30, 24, 22, 44, style.trim, {
        balcony: true,
        shutters: '#3f6a5a',
        seed: 1,
      });
      upperWindow(c, b.x + 120, 24, 22, 44, style.trim, {
        balcony: true,
        shutters: '#3f6a5a',
        seed: 2,
      });
      pilaster(c, b.x + 4, 20, style);
      pilaster(c, b.x + b.w - 30, 22, style);
      shutterShop(c, L);
    } else if (b.id === 'bar') {
      upperWindow(c, b.x + 26, 26, 20, 42, style.trim, { balcony: true, seed: 3 });
      gallery(c, b.x + 96, 18, 136, 50);
      upperWindow(c, b.x + b.w - 46, 26, 20, 42, style.trim, { balcony: true, seed: 4 });
      barFrontage(c, L);
    } else {
      upperWindow(c, b.x + 36, 24, 22, 44, style.trim, {
        balcony: true,
        shutters: '#e9e2d0',
        seed: 5,
      });
      upperWindow(c, b.x + 130, 24, 22, 44, style.trim, {
        balcony: true,
        shutters: '#e9e2d0',
        seed: 6,
      });
      upperWindow(c, b.x + 220, 24, 22, 44, style.trim, {
        balcony: true,
        shutters: '#e9e2d0',
        seed: 7,
      });
      pilaster(c, b.x + 4, 20, style);
      pilaster(c, L.portal.x + L.portal.w + 22, 20, style);
      pilaster(c, b.x + b.w - 20, 20, style);
      portalDoor(c, L);
      fruitShop(c, L);
    }
  }
  // Drainpipes at the party walls
  for (const b of L.buildings.slice(1)) {
    c.rect(b.x - 2, 8, 4, 150, '#6e6a70').rect(b.x - 2, 8, 1, 150, '#9a96a0');
    for (let j = 30; j < 150; j += 40) c.rect(b.x - 3, j, 6, 2, '#57535b');
  }
}

// ---------------------------------------------------------------- ground

function sidewalk(c, L) {
  const base = '#cbbfa9';
  const top = L.facadeBottom;
  const bottom = L.sidewalkBottom;
  for (let j = top; j < bottom; j++) {
    for (let i = 0; i < c.w; i++) {
      const slab = Math.floor(i / 20) + Math.floor((j - top) / 10) * 7;
      const tone = mix(base, noise(slab, 1, 21) > 0.5 ? '#bfb29b' : '#d3c8b3', 0.5);
      c.px(i, j, noise(i, j, 22) > 0.93 ? darken(tone, 0.08) : tone);
    }
  }
  for (let i = 0; i < c.w; i += 20) c.rect(i, top, 1, bottom - top, '#a89b86');
  c.rect(0, top + 10, c.w, 1, '#a89b86');
  // shadow of the buildings along the wall foot
  for (let j = top; j < top + 5; j++) {
    for (let i = 0; i < c.w; i++)
      if (bayer(i, j) < 0.7 - (j - top) * 0.14) c.px(i, j, '#4a3446', 0.35);
  }
  // kerb line between the sidewalk and the paved street
  c.rect(0, bottom - 2, c.w, 2, '#e1d8c6').rect(0, bottom, c.w, 1, '#8f8474');
}

/** Granite setts, staggered, with warm/cool variation. */
function paving(c, L) {
  const top = L.sidewalkBottom + 1;
  const bottom = L.curbTop;
  const joint = '#9a8f7e';
  const tones = ['#b9ad98', '#c4b9a4', '#afa38f', '#bfb09a', '#c9bda7'];
  for (let j = top; j < bottom; j++) {
    const row = Math.floor((j - top) / 8);
    const offset = row % 2 ? 6 : 0;
    for (let i = 0; i < c.w; i++) {
      const col = Math.floor((i + offset) / 12);
      const inJointX = (i + offset) % 12 === 0;
      const inJointY = (j - top) % 8 === 0;
      if (inJointX || inJointY) {
        c.px(i, j, joint);
        continue;
      }
      let tone = tones[Math.floor(noise(col, row, 31) * tones.length)];
      const lx = (i + offset) % 12;
      const ly = (j - top) % 8;
      if (lx === 1 || ly === 1)
        tone = lighten(tone, 0.07); // lit top-left bevel
      else if (ly === 7) tone = darken(tone, 0.06);
      if (noise(i, j, 32) > 0.96) tone = darken(tone, 0.12);
      c.px(i, j, tone);
    }
  }
  // Central drainage channel (flat granite strip running along the street)
  const dy = 372;
  c.rect(0, dy, c.w, 6, '#a39885')
    .rect(0, dy, c.w, 1, '#d8cdb8')
    .rect(0, dy + 5, c.w, 1, '#7c7162');
  for (let i = 8; i < c.w; i += 20) c.rect(i, dy + 2, 10, 2, '#8e8371');
  // Two cast-iron drain grates
  for (const gx of [260, 560]) {
    c.rect(gx, dy - 1, 20, 8, '#3a373e');
    for (let k = 1; k < 20; k += 3) c.rect(gx + k, dy, 1, 6, '#1f1d22');
  }
}

function curbAndRoad(c, L) {
  const y = L.curbTop;
  c.rect(0, y, c.w, 3, '#e3dac8').rect(0, y + 3, c.w, 3, '#9d9383');
  c.rect(0, y + 6, c.w, c.h - y - 6, '#4e4b55');
  for (let i = 0; i < c.w; i++)
    for (let j = y + 6; j < c.h; j++) if (noise(i, j, 41) > 0.9) c.px(i, j, '#5a5762');
  // Yellow no-parking line on the road edge
  c.rect(0, y + 8, c.w, 1, '#d8b64a', 0.8);
}

// ---------------------------------------------------------------- shadows

function softShadow(c, cx, cy, rx, ry, strength = 0.55) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const density = d < 0.55 ? strength : strength * 0.45;
      if (bayer(x, y) < density) c.px(x, y, '#3b2a44', 0.33);
    }
  }
}

function treeGrate(c, x, y) {
  c.rect(x - 14, y - 7, 28, 14, '#3e3a40');
  c.rect(x - 14, y - 7, 28, 1, '#6a6570');
  for (let k = -12; k <= 12; k += 3) c.rect(x + k, y - 5, 1, 11, '#262328');
  c.rect(x - 5, y - 4, 10, 8, '#5b4632');
}

function bakedShadows(c, L) {
  // Light comes from the west: shadows lean east (to the right).
  for (const t of L.trees) {
    softShadow(c, t.x + 26, t.y - 6, 50, 20, 0.6);
    treeGrate(c, t.x, t.y);
  }
  for (const t of L.tables) softShadow(c, t.x + 12, t.y - 4, 30, 11, 0.55);
  // terrace windbreak casts a thin shadow
  const tr = L.terrace;
  for (let x = tr.x; x < tr.x + tr.w; x++) {
    if (x >= tr.gapX && x < tr.gapX + tr.gapW) continue;
    for (let j = 1; j <= 3; j++) c.px(x + 2, tr.y + tr.h + j, '#3b2a44', 0.18);
  }
  softShadow(c, L.bench.x + 6, L.bench.y + 1, 26, 5, 0.5);
  softShadow(c, L.board.x + 4, L.board.y + 1, 10, 3, 0.6);
  for (const b of L.bollards) softShadow(c, b.x + 3, b.y + 1, 6, 2.5, 0.6);
}

export function drawBackground(L) {
  const w = L.widthTiles * L.tile;
  const h = L.heightTiles * L.tile;
  const c = new Canvas(w, h);
  facades(c, L);
  sidewalk(c, L);
  paving(c, L);
  curbAndRoad(c, L);
  bakedShadows(c, L);
  return c;
}
