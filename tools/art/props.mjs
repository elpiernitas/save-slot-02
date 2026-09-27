// Props the player can walk in front of or behind (y-sorted at runtime).
// Each prop: { canvas, anchorX, anchorY, frames } — the anchor is the ground
// contact point in sprite pixels; frames are laid out horizontally.
// Scale ≈ 34 px per metre (a 40×60 character ≈ 1.75 m).
import { Canvas, bayer, cool, darken, lighten, mix, noise, warm } from './canvas.mjs';
import { smallText } from './font.mjs';

const shade = (c, t = 0.28) => cool(c, t);

// ---------------------------------------------------------------- tree

/** Big leafy street tree (plane/linden). Canopy built from leaf clumps. */
function tree(frame, seed = 0) {
  const w = 224;
  const h = 256;
  const c = new Canvas(w, h);
  const cx = 112;
  const base = 250;
  // trunk: mottled plane-tree bark, flared at the base
  for (let y = 130; y <= base; y++) {
    const t = (y - 130) / (base - 130);
    const half = Math.round(7 + t * 3 + (y > base - 8 ? (y - base + 8) * 0.8 : 0));
    for (let x = cx - half; x <= cx + half; x++) {
      const n = noise(Math.floor(x / 2), Math.floor(y / 4), 51 + seed);
      let tone = n > 0.62 ? '#c2b89c' : n > 0.3 ? '#8f8068' : '#6c604e';
      const u = (x - (cx - half)) / (2 * half);
      if (u > 0.62) tone = shade(tone, 0.3);
      else if (u < 0.22) tone = warm(tone, 0.2);
      c.px(x, y, tone);
    }
  }
  // limbs
  const limb = (x0, y0, x1, y1, wdt) => {
    for (let k = 0; k <= 1; k += 0.02) {
      const x = x0 + (x1 - x0) * k;
      const y = y0 + (y1 - y0) * k;
      c.rect(
        Math.round(x - wdt / 2),
        Math.round(y),
        Math.max(1, Math.round(wdt)),
        2,
        k > 0.5 ? '#6c604e' : '#8f8068',
      );
    }
  };
  limb(cx - 2, 150, cx - 40, 112, 6);
  limb(cx + 2, 146, cx + 44, 106, 6);
  limb(cx, 140, cx - 6, 96, 5);
  // canopy silhouette = union of big lobes
  const lobes = [
    [112, 104, 96, 58],
    [52, 122, 48, 38],
    [172, 118, 50, 40],
    [86, 70, 52, 38],
    [142, 68, 52, 36],
    [112, 144, 70, 28],
    [28, 98, 26, 24],
    [196, 96, 26, 24],
  ];
  const inside = (x, y) =>
    lobes.some(([ox, oy, rx, ry]) => {
      const dx = (x + 0.5 - ox) / rx;
      const dy = (y + 0.5 - oy) / ry;
      return dx * dx + dy * dy <= 1 - noise(x, y, 52 + seed) * 0.18;
    });
  const leaf = ['#1f3d2a', '#2d5433', '#3f6e3c', '#5a8c46', '#82b05a', '#b8d67a'];
  const sway = frame === 1 ? 1 : 0;
  for (let y = 0; y < 176; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      // leaf clumps: nearest jittered point on an 8 px grid (organic, not a grid)
      let best = 1e9;
      let bx = 0;
      let by = 0;
      let bn = 0;
      const cx0 = Math.floor(x / 8);
      const cy0 = Math.floor(y / 8);
      for (let gy = cy0 - 1; gy <= cy0 + 1; gy++) {
        for (let gx = cx0 - 1; gx <= cx0 + 1; gx++) {
          const px = gx * 8 + noise(gx, gy, 57 + seed) * 8;
          const py = gy * 8 + noise(gx, gy, 58 + seed) * 8;
          const d = (x - px) ** 2 + (y - py) ** 2;
          if (d < best) {
            best = d;
            bx = px;
            by = py;
            bn = noise(gx, gy, 53 + seed);
          }
        }
      }
      const r = Math.sqrt(best) / 6;
      // global light: from the upper west; underside and east side in shade
      const gxn = (x - cx) / 100;
      const gyn = (y - 106) / 70;
      let k = 2.7 - gxn * 1.1 - gyn * 1.5 + (bn - 0.5) * 1.1;
      k += (bx - x + (by - y)) / 7; // each clump lit on its upper-left
      k -= r * 0.6; // clump edges darker
      k += (bayer(x, y) - 0.5) * 0.7;
      k = Math.max(0, Math.min(5, Math.round(k)));
      // a few see-through gaps near the lower edge
      if (y > 136 && noise(x, y, 54 + seed) > 0.93) continue;
      const tx = x + (y < 96 ? sway : 0);
      c.px(tx, y, leaf[k]);
    }
  }
  // cool shadow pocket under the canopy (ambient occlusion) + sun flecks
  for (let y = 138; y < 176; y++) {
    for (let x = 0; x < w; x++)
      if (c.alphaAt(x, y) && bayer(x, y) < 0.45) c.px(x, y, '#1a2c3a', 0.4);
  }
  for (let k = 0; k < 36; k++) {
    const x = 30 + Math.floor(noise(k, frame, 55 + seed) * 120);
    const y = 42 + Math.floor(noise(k, 7, 56 + seed) * 70);
    if (c.alphaAt(x, y) && c.alphaAt(x + 1, y)) c.px(x, y, '#e6f2a4').px(x + 1, y, '#cfe68c');
  }
  c.outline(0.5);
  return { canvas: c, anchorX: cx, anchorY: base };
}

// ---------------------------------------------------------------- terrace

const BEIGE = '#ead9b0';
const GUESTS = [
  { hair: '#2b2024', skin: '#e2b08c', top: '#d9573f' },
  { hair: '#8a5a32', skin: '#d59d78', top: '#3f6a8a' },
  { hair: '#d2b37a', skin: '#efc3a0', top: '#f2eee6' },
  { hair: '#1c1a20', skin: '#b67c5a', top: '#5f7a4a' },
  { hair: '#5a3a2a', skin: '#e6b896', top: '#e8b83a' },
  { hair: '#9a9aa2', skin: '#e0b290', top: '#2e3f66' },
];

function chair(c, x, y, facing) {
  // aluminium bistro chair with a woven (rattan-look) seat and back
  const frame = '#a3a9b0';
  const seat = '#b8854c';
  if (facing === 'front') {
    c.rect(x, y - 22, 14, 2, frame)
      .rect(x, y - 20, 1, 10, frame)
      .rect(x + 13, y - 20, 1, 10, frame);
    for (let k = 1; k < 13; k += 2)
      c.rect(x + k, y - 20, 1, 9, k % 4 === 1 ? seat : darken(seat, 0.15));
    c.rect(x - 1, y - 11, 16, 4, seat).rect(x - 1, y - 11, 16, 1, warm(seat, 0.3));
    c.rect(x, y - 7, 1, 7, frame).rect(x + 13, y - 7, 1, 7, shade(frame));
  } else {
    c.rect(x - 1, y - 11, 16, 4, seat).rect(x - 1, y - 11, 16, 1, warm(seat, 0.3));
    c.rect(x - 1, y - 17, 16, 6, darken(seat, 0.12));
    c.rect(x, y - 7, 1, 7, frame).rect(x + 13, y - 7, 1, 7, shade(frame));
  }
}

/** Seated guest; `back` = seen from behind. */
function guest(c, x, y, g, back) {
  // torso
  c.rect(x - 6, y - 17, 13, 13, g.top).rect(x + 4, y - 17, 3, 13, shade(g.top, 0.3));
  c.rect(x - 6, y - 17, 1, 13, warm(g.top, 0.3));
  c.ellipse(x + 0.5, y - 17, 7, 2.5, g.top);
  // head
  c.ellipse(x + 0.5, y - 24, 5, 5.5, g.skin);
  if (back) {
    c.ellipse(x + 0.5, y - 25, 5.3, 5, g.hair).rect(x - 4, y - 24, 10, 3, g.hair);
    c.px(x - 2, y - 28, lighten(g.hair, 0.3));
  } else {
    c.ellipse(x + 0.5, y - 27.5, 5.3, 3.2, g.hair);
    c.rect(x - 2, y - 24, 1, 2, '#231a20').rect(x + 2, y - 24, 1, 2, '#231a20');
    c.rect(x, y - 21, 2, 1, darken(g.skin, 0.3));
    c.rect(x - 9, y - 10, 4, 3, g.skin).rect(x + 6, y - 10, 4, 3, shade(g.skin, 0.2)); // hands on the table
  }
}

/** Round bistro table + four chairs; `guests` = seats taken (0–4). */
function table(guests, seed) {
  const w = 92;
  const h = 70;
  const c = new Canvas(w, h);
  const cx = 46;
  const base = 64;
  const people = [0, 1, 2, 3].map((k) => GUESTS[(k + seed) % GUESTS.length]);
  chair(c, cx - 26, base - 8, 'back');
  chair(c, cx + 12, base - 8, 'back');
  if (guests > 0) guest(c, cx - 19, base - 12, people[0], false);
  if (guests > 2) guest(c, cx + 19, base - 12, people[2], false);
  // marble top + cast-iron base
  c.ellipse(cx, base - 22, 17, 6, '#d6d0c4').ellipse(cx, base - 23, 16, 5, '#f3efe6');
  c.rect(cx - 16, base - 21, 33, 2, shade('#b0aa9e', 0.2));
  c.rect(cx - 1, base - 19, 3, 15, '#3a383e').rect(cx - 8, base - 4, 17, 3, '#3a383e');
  if (guests > 0) {
    // coffee cups, a caña and a small plate
    c.rect(cx - 8, base - 28, 4, 3, '#ffffff')
      .px(cx - 4, base - 27, '#ffffff')
      .rect(cx - 9, base - 25, 6, 1, '#d9d3c8');
    c.rect(cx + 4, base - 31, 3, 6, '#f0b93a', 0.9).rect(cx + 4, base - 31, 3, 1, '#fff6de');
    c.ellipse(cx - 1, base - 23, 4, 1.5, '#ffffff').px(cx - 2, base - 24, '#d4a45a');
  }
  chair(c, cx - 33, base + 2, 'front');
  chair(c, cx + 19, base + 2, 'front');
  if (guests > 1) guest(c, cx + 26, base - 2, people[1], true);
  if (guests > 3) guest(c, cx - 26, base - 2, people[3], true);
  c.outline(0.55);
  return { canvas: c, anchorX: cx, anchorY: base };
}

/** Beige La Muralla umbrella, anchored on its table's ground point. */
function umbrella() {
  const w = 148;
  const h = 118;
  const c = new Canvas(w, h);
  const cx = 74;
  const base = 114;
  c.rect(cx - 1, 40, 3, base - 40 - 26, '#d4cec2').rect(
    cx + 1,
    40,
    1,
    base - 40 - 26,
    shade('#9a948a', 0.3),
  );
  const top = 8;
  const rimY = top + 30;
  for (let y = top; y <= rimY; y++) {
    const t = (y - top) / (rimY - top);
    const half = Math.round(7 + t * 53);
    for (let x = cx - half; x <= cx + half; x++) {
      const u = (x - cx) / (half + 1);
      const panel = Math.floor(u * 4 + 4);
      let tone = panel % 2 ? BEIGE : darken(BEIGE, 0.06);
      if (u < -0.35) tone = warm(lighten(tone, 0.08), 0.18); // sun side
      if (u > 0.45) tone = shade(tone, 0.2);
      c.px(x, y, tone);
    }
  }
  for (const k of [-3, -1, 1, 3]) c.line(cx, top, cx + k * 15, rimY, darken(BEIGE, 0.2), 0.7);
  // valance with scallops and the bar name
  for (let x = cx - 60; x <= cx + 60; x++) {
    const d = (x - cx + 60) % 12 < 9 ? 7 : 5;
    let col = darken(BEIGE, 0.05);
    if (x > cx + 30) col = shade(col, 0.2);
    c.rect(x, rimY + 1, 1, d, col);
  }
  c.rect(cx - 60, rimY + 2, 121, 1, '#2f5a47');
  smallText(c, 'LA MURALLA', cx - 19, rimY + 3, '#2f5a47');
  c.rect(cx - 2, top - 5, 5, 5, '#c7b184');
  c.outline(0.55);
  return { canvas: c, anchorX: cx, anchorY: base };
}

function windbreakFront(width) {
  const h = 46;
  const c = new Canvas(width, h);
  const base = h - 1;
  const alu = '#b3b9c0';
  for (let x = 0; x < width; x++) {
    for (let y = 7; y < base - 5; y++) {
      const t = (y - 7) / (base - 12);
      c.px(x, y, mix('#d9ecf0', '#9fbac4', t), 0.26);
    }
  }
  for (let x = 6; x < width; x += 29) {
    for (let k = 0; k < 24; k++) {
      c.px(x + Math.floor(k * 0.5), 10 + k, '#ffffff', 0.5);
      c.px(x + 4 + Math.floor(k * 0.5), 10 + k, '#ffffff', 0.25);
    }
  }
  c.rect(0, 22, width, 1, '#2f5a47', 0.35);
  c.rect(0, 6, width, 2, alu).rect(0, 6, width, 1, lighten(alu, 0.45));
  c.rect(0, base - 5, width, 5, shade(alu, 0.15)).rect(0, base - 5, width, 1, lighten(alu, 0.3));
  c.rect(0, base, width, 1, darken(alu, 0.5));
  for (let x = 0; x < width; x += 40)
    c.rect(x, 6, 2, base - 6, alu).rect(x + 1, 6, 1, base - 6, shade(alu, 0.3));
  c.rect(width - 2, 6, 2, base - 6, alu).rect(width - 1, 6, 1, base - 6, shade(alu, 0.3));
  return { canvas: c, anchorX: 0, anchorY: base };
}

/** A 16 px run of the side screen, seen almost edge-on. */
function windbreakSide() {
  const w = 6;
  const h = 16 + 40;
  const c = new Canvas(w, h);
  const alu = '#b3b9c0';
  for (let y = 0; y < h; y++) c.rect(1, y, 3, 1, '#c9e0e8', 0.35).px(2, y, '#ffffff', 0.25);
  c.rect(0, 0, 5, 2, alu).rect(0, 0, 5, 1, lighten(alu, 0.4));
  c.rect(0, 0, 2, h, alu).rect(4, 0, 1, h, shade(alu, 0.3));
  c.rect(0, h - 5, 5, 5, shade(alu, 0.15));
  return { canvas: c, anchorX: 2, anchorY: h - 1 };
}

// ---------------------------------------------------------------- street furniture

function board() {
  const c = new Canvas(30, 46);
  const wood = '#8a5a36';
  c.line(4, 44, 8, 3, darken(wood, 0.2)).line(25, 44, 21, 3, shade(wood, 0.3));
  c.rect(6, 3, 18, 34, wood).rect(6, 3, 18, 1, warm(wood, 0.4)).rect(6, 3, 1, 34, warm(wood, 0.3));
  c.rect(8, 5, 14, 30, '#262d2b');
  smallText(c, 'HOY', 10, 8, '#f2efe6');
  c.rect(9, 15, 11, 1, '#f2efe6', 0.6)
    .rect(9, 18, 8, 1, '#f2efe6', 0.6)
    .rect(9, 21, 10, 1, '#f2efe6', 0.6);
  // chalk cup doodle
  c.rect(11, 26, 6, 4, '#f2efe6', 0.8)
    .px(17, 27, '#f2efe6')
    .px(13, 24, '#f2efe6', 0.6)
    .px(14, 23, '#f2efe6', 0.6);
  c.px(18, 31, '#f09a9a').px(19, 31, '#f09a9a');
  c.outline(0.5);
  return { canvas: c, anchorX: 15, anchorY: 44 };
}

function bollard(marked) {
  const c = new Canvas(18, 36);
  const iron = '#34323c';
  for (let y = 6; y < 32; y++) {
    const off = marked ? Math.floor((32 - y) / 10) : 0;
    c.rect(5 + off, y, 8, 1, iron)
      .px(5 + off, y, lighten(iron, 0.35))
      .px(6 + off, y, lighten(iron, 0.18))
      .px(12 + off, y, shade(iron, 0.4));
  }
  const off = marked ? 2 : 0;
  c.ellipse(9 + off, 6, 4.5, 3, iron)
    .px(7 + off, 5, lighten(iron, 0.5))
    .px(8 + off, 4, lighten(iron, 0.4));
  c.rect(4, 31, 10, 3, darken(iron, 0.2));
  c.rect(5 + (marked ? 1 : 0), 11, 8, 2, '#d0a94c').px(5 + (marked ? 1 : 0), 11, '#f2d98a');
  if (marked) {
    c.ellipse(9, 20, 2.6, 2.6, '#f2efe6').px(9, 20, '#d8483f').px(8, 20, '#d8483f');
    c.px(11, 25, '#8a8690').px(12, 15, '#8a8690').px(7, 27, '#8a8690');
  }
  c.outline(0.5);
  return { canvas: c, anchorX: 9, anchorY: 33 };
}

function planter() {
  const c = new Canvas(34, 46);
  const box = '#5d6a62';
  c.rect(4, 28, 26, 16, box)
    .rect(4, 28, 3, 16, lighten(box, 0.25))
    .rect(26, 28, 4, 16, shade(box, 0.35));
  c.rect(3, 26, 28, 3, lighten(box, 0.15)).rect(3, 26, 28, 1, lighten(box, 0.4));
  const leaf = ['#23452d', '#335e38', '#4a7d44', '#6a9e52', '#96c26a'];
  for (let y = 2; y < 30; y++) {
    for (let x = 2; x < 32; x++) {
      const dx = (x + 0.5 - 17) / 14;
      const dy = (y + 0.5 - 16) / 13;
      if (dx * dx + dy * dy > 1 - noise(x, y, 61) * 0.3) continue;
      const k = Math.max(
        0,
        Math.min(4, Math.round(2 - dx * 1.2 - dy * 1.4 + (bayer(x, y) - 0.5) * 0.9)),
      );
      c.px(x, y, leaf[k]);
    }
  }
  for (let k = 0; k < 9; k++) {
    const x = 6 + Math.floor(noise(k, 1, 62) * 22);
    const y = 5 + Math.floor(noise(k, 2, 62) * 16);
    c.px(x, y, ['#e8453c', '#f7f1e6', '#f6c94a'][k % 3]).px(
      x + 1,
      y,
      ['#c8342c', '#e2dccf', '#d9ab34'][k % 3],
    );
  }
  c.outline(0.5);
  return { canvas: c, anchorX: 17, anchorY: 43 };
}

/** Wooden bench with an older man reading the paper. */
function benchOccupied() {
  const c = new Canvas(76, 58);
  const wood = '#b07a45';
  const iron = '#302f36';
  // man, seated at the right-hand end, reading
  const mx = 50;
  c.rect(mx - 7, 16, 15, 16, '#6a7a8a').rect(mx + 4, 16, 4, 16, shade('#6a7a8a', 0.3)); // jacket
  c.ellipse(mx + 0.5, 10, 5.5, 6, '#e2b18e');
  c.ellipse(mx + 0.5, 6, 5.8, 3.5, '#c9c6c0');
  c.rect(mx - 3, 10, 2, 1, '#231a20').rect(mx + 2, 10, 2, 1, '#231a20');
  c.rect(mx - 12, 20, 16, 12, '#f1ede2').rect(mx - 12, 20, 16, 1, '#ffffff'); // newspaper
  for (let k = 22; k < 31; k += 2) c.rect(mx - 10, k, 12, 1, '#b9b3a6');
  c.rect(mx - 4, 32, 12, 6, '#3a3d4a')
    .rect(mx - 4, 38, 4, 12, '#3a3d4a')
    .rect(mx + 3, 38, 4, 12, shade('#3a3d4a', 0.2));
  c.rect(mx - 5, 50, 6, 3, '#2a2226').rect(mx + 2, 50, 6, 3, '#2a2226');
  // bench: backrest slats behind him are drawn after for the part left of him
  for (let k = 0; k < 3; k++) {
    c.rect(3, 12 + k * 6, mx - 12, 4, k % 2 ? wood : warm(wood, 0.15)).rect(
      3,
      15 + k * 6,
      mx - 12,
      1,
      darken(wood, 0.3),
    );
    c.rect(mx + 9, 12 + k * 6, 76 - mx - 12, 4, k % 2 ? wood : warm(wood, 0.15));
  }
  for (let k = 0; k < 3; k++)
    c.rect(2, 32 + k * 4, 72, 3, warm(wood, 0.2 - k * 0.07)).rect(
      2,
      35 + k * 4,
      72,
      1,
      darken(wood, 0.35),
    );
  for (const x of [5, 68]) c.rect(x, 10, 4, 44, iron).px(x, 10, lighten(iron, 0.4));
  c.rect(4, 52, 6, 3, iron).rect(67, 52, 6, 3, iron);
  c.outline(0.5);
  return { canvas: c, anchorX: 38, anchorY: 54 };
}

/** A parked city bike with a front basket. */
function bike() {
  const c = new Canvas(64, 42);
  const frame = '#2f6a8a';
  const tyre = '#232128';
  const wheel = (x, y) => {
    for (let a = 0; a < Math.PI * 2; a += 0.05)
      c.px(x + Math.cos(a) * 11, y + Math.sin(a) * 11, tyre).px(
        x + Math.cos(a) * 10,
        y + Math.sin(a) * 10,
        '#4a4852',
      );
    for (let a = 0; a < Math.PI; a += Math.PI / 6)
      c.line(
        x - Math.cos(a) * 9,
        y - Math.sin(a) * 9,
        x + Math.cos(a) * 9,
        y + Math.sin(a) * 9,
        '#9a9aa4',
        0.6,
      );
    c.rect(x - 1, y - 1, 3, 3, '#c9c9d2');
  };
  wheel(14, 28);
  wheel(50, 28);
  c.line(14, 28, 28, 14, frame).line(28, 14, 44, 14, frame).line(44, 14, 50, 28, frame);
  c.line(14, 28, 32, 28, frame).line(32, 28, 28, 14, frame).line(32, 28, 44, 14, frame);
  c.line(15, 27, 29, 13, lighten(frame, 0.3));
  c.rect(24, 10, 10, 3, '#3a2a22').rect(24, 10, 10, 1, '#5a4636'); // saddle
  c.line(44, 14, 46, 6, '#8a8a94').rect(43, 5, 8, 2, '#2a2a30'); // handlebar
  c.rect(47, 7, 12, 8, '#b98a52').rect(47, 7, 12, 1, lighten('#b98a52', 0.3)); // basket
  for (let k = 48; k < 59; k += 3) c.rect(k, 8, 1, 7, darken('#b98a52', 0.3));
  c.rect(49, 5, 4, 3, '#7aa84a').rect(54, 4, 3, 4, '#e8c64a'); // groceries
  c.line(31, 28, 34, 36, '#8a8a94'); // kickstand
  c.outline(0.5);
  return { canvas: c, anchorX: 32, anchorY: 39 };
}

function gull(frame) {
  const c = new Canvas(24, 22);
  const white = '#f6f4ef';
  const grey = '#9ea8b3';
  c.ellipse(11, 12, 8, 5, white);
  c.rect(4, 9, 13, 4, grey)
    .rect(4, 9, 13, 1, lighten(grey, 0.3))
    .rect(12, 12, 5, 1, shade(grey, 0.3));
  c.rect(1, 10, 4, 3, '#2c2a30').px(3, 9, '#f6f4ef');
  const hx = frame === 1 ? 18 : 17;
  const hy = frame === 1 ? 4 : 5;
  c.ellipse(hx, hy + 1, 3.6, 3.4, white);
  c.px(hx + 1, hy, '#1c1518');
  c.rect(hx + 3, hy + 1, 3, 1, '#e8b53a').px(hx + 4, hy + 2, '#d8483f');
  c.rect(8, 17, 1, 3, '#e3a07a').rect(12, 17, 1, 3, '#e3a07a');
  c.outline(0.5);
  return { canvas: c, anchorX: 11, anchorY: 19 };
}

function strip(frames) {
  const w = frames[0].canvas.w;
  const h = frames[0].canvas.h;
  const c = new Canvas(w * frames.length, h);
  frames.forEach((f, i) => c.blit(f.canvas, i * w, 0));
  return {
    canvas: c,
    anchorX: frames[0].anchorX,
    anchorY: frames[0].anchorY,
    frames: frames.length,
  };
}

/** All props for a layout, keyed by sprite id. */
export function drawProps(L) {
  const tr = L.terrace;
  const westRun = tr.gapX - tr.x;
  const eastRun = tr.x + tr.w - (tr.gapX + tr.gapW);
  return {
    tree: strip([tree(0), tree(1)]),
    umbrella: umbrella(),
    tableOccupiedA: table(3, 0),
    tableOccupiedB: table(4, 2),
    tableOccupiedC: table(2, 4),
    tableEmpty: table(0, 0),
    windbreakWest: windbreakFront(westRun),
    windbreakEast: windbreakFront(eastRun),
    windbreakSide: windbreakSide(),
    board: board(),
    bollard: bollard(false),
    bollardMarked: bollard(true),
    planter: planter(),
    bench: benchOccupied(),
    bike: bike(),
    gull: strip([gull(0), gull(1)]),
  };
}
