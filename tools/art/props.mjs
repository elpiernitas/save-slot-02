// Props that the player can walk in front of or behind (y-sorted at runtime).
// Each prop: { canvas, anchorX, anchorY, frames } — the anchor is the ground
// contact point, in sprite pixels; frames are laid out horizontally.
import { Canvas, bayer, darken, lighten, mix, noise } from './canvas.mjs';
import { smallText } from './font.mjs';

// ---------------------------------------------------------------- tree

function tree(frame) {
  const w = 112;
  const h = 136;
  const c = new Canvas(w, h);
  const cx = 56;
  const base = 130;
  // trunk: plane-tree bark, mottled
  const bark = '#8a7a66';
  for (let y = 66; y <= base; y++) {
    const half = y > base - 6 ? 7 : 5;
    for (let x = cx - half; x <= cx + half; x++) {
      const n = noise(x, Math.floor(y / 3), 51);
      let tone = n > 0.66 ? '#b3a88f' : n > 0.33 ? bark : '#6e6252';
      if (x > cx + 1) tone = darken(tone, 0.2);
      if (x === cx - half) tone = lighten(tone, 0.15);
      c.px(x, y, tone);
    }
  }
  // two branches
  c.line(cx - 1, 86, cx - 18, 62, '#6e6252').line(cx, 86, cx - 17, 62, bark);
  c.line(cx + 1, 82, cx + 20, 58, '#5e5344').line(cx + 2, 82, cx + 21, 58, '#6e6252');
  // canopy: clusters with a shaded underside and lit west crown
  const leaf = ['#2f5a33', '#3f7440', '#56904a', '#7aae58', '#a7cf73'];
  const clusters = [
    [56, 48, 42, 29],
    [28, 58, 22, 18],
    [84, 56, 24, 19],
    [44, 30, 22, 16],
    [70, 28, 22, 16],
    [56, 70, 30, 12],
    [20, 40, 14, 12],
    [94, 40, 14, 12],
  ];
  const sway = frame === 1 ? 1 : 0;
  for (const [ox, oy, rx, ry] of clusters) {
    for (let y = Math.floor(oy - ry); y <= oy + ry; y++) {
      for (let x = Math.floor(ox - rx); x <= ox + rx; x++) {
        const dx = (x + 0.5 - ox) / rx;
        const dy = (y + 0.5 - oy) / ry;
        const d = dx * dx + dy * dy;
        // ragged leafy edge
        if (d > 1 - noise(x, y, 52) * 0.25) continue;
        // light from the upper west
        const light =
          -dx * 0.55 - dy * 0.75 + (noise(Math.floor(x / 3), Math.floor(y / 3), 53) - 0.5) * 0.9;
        let k = 2 + Math.round(light * 1.6 + (bayer(x, y) - 0.5) * 0.8);
        k = Math.max(0, Math.min(4, k));
        c.px(x + (y < oy - ry * 0.3 ? sway : 0), y, leaf[k]);
      }
    }
  }
  // underside shade and a few sun flecks
  for (let x = 20; x < 96; x++)
    for (let y = 66; y < 84; y++)
      if (c.alphaAt(x, y) && bayer(x, y) < 0.35) c.px(x, y, '#1f3a26', 0.5);
  for (let k = 0; k < 24; k++) {
    const x = Math.floor(noise(k, frame, 54) * 60) + 18;
    const y = Math.floor(noise(k, 7, 55) * 30) + 22;
    if (c.alphaAt(x, y) && c.alphaAt(x + 1, y)) c.px(x, y, '#d6ec9a').px(x + 1, y, '#bddd84');
  }
  c.outline(0.5);
  return { canvas: c, anchorX: cx, anchorY: base };
}

// ---------------------------------------------------------------- terrace

const CANVAS_BEIGE = '#e8d6ae';

function chair(c, x, y, facing) {
  // aluminium bistro chair with a woven seat
  const frame = '#8f959c';
  const seat = '#b7864f';
  if (facing === 'front') {
    c.rect(x, y - 16, 10, 2, frame)
      .rect(x, y - 14, 1, 7, frame)
      .rect(x + 9, y - 14, 1, 7, frame);
    for (let k = 1; k < 9; k += 2) c.rect(x + k, y - 14, 1, 6, seat);
    c.rect(x - 1, y - 8, 12, 3, seat).rect(x - 1, y - 8, 12, 1, lighten(seat, 0.25));
    c.rect(x, y - 5, 1, 5, frame).rect(x + 9, y - 5, 1, 5, frame);
  } else {
    // seen from the back/side: just the seat and legs
    c.rect(x - 1, y - 8, 12, 3, seat).rect(x - 1, y - 8, 12, 1, lighten(seat, 0.25));
    c.rect(x - 1, y - 12, 12, 4, darken(seat, 0.15));
    c.rect(x, y - 5, 1, 5, frame).rect(x + 9, y - 5, 1, 5, frame);
  }
}

function tableSet(open = true) {
  const w = 96;
  const h = 100;
  const c = new Canvas(w, h);
  const cx = 48;
  const base = 94;
  // chairs behind the table first
  chair(c, cx - 20, base - 6, 'back');
  chair(c, cx + 10, base - 6, 'back');
  // pole
  c.rect(cx - 1, 30, 2, base - 34, '#c9c3b8').rect(cx, 30, 1, base - 34, '#8f8a82');
  // round marble table top + cast base
  c.ellipse(cx, base - 16, 13, 5, '#dcd6cb').ellipse(cx, base - 17, 12, 4, '#f1ede4');
  c.rect(cx - 12, base - 15, 25, 2, '#a9a397');
  c.rect(cx - 1, base - 13, 3, 10, '#3a383e').rect(cx - 6, base - 3, 13, 2, '#3a383e');
  // a coffee cup and a saucer on the table
  c.rect(cx + 3, base - 21, 4, 3, '#ffffff')
    .px(cx + 7, base - 20, '#ffffff')
    .rect(cx + 2, base - 18, 6, 1, '#d9d3c8');
  // chairs in front
  chair(c, cx - 26, base + 2, 'front');
  chair(c, cx + 16, base + 2, 'front');
  if (!open) {
    // folded umbrella: a slim furled canopy with a strap
    for (let y = 22; y < 62; y++) {
      const half = Math.max(1, Math.round(((y - 22) / 40) * 5));
      for (let x = cx - half; x <= cx + half; x++) {
        c.px(x, y, x < cx ? lighten(CANVAS_BEIGE, 0.1) : darken(CANVAS_BEIGE, 0.12));
      }
    }
    c.rect(cx - 4, 48, 9, 2, '#2f5a47');
    c.rect(cx - 1, 18, 3, 4, '#b9a37a');
    c.outline(0.55);
    return { canvas: c, anchorX: cx, anchorY: base };
  }
  // umbrella canopy: octagonal, ribs, scalloped valance
  const top = 8;
  for (let y = top; y < top + 24; y++) {
    const t = (y - top) / 23;
    const half = Math.round(8 + t * 36);
    for (let x = cx - half; x <= cx + half; x++) {
      const panel = Math.floor(((x - cx) / (half + 1)) * 4 + 4);
      let tone = panel % 2 ? CANVAS_BEIGE : darken(CANVAS_BEIGE, 0.07);
      if (x < cx - half * 0.4) tone = lighten(tone, 0.12); // lit west side
      if (x > cx + half * 0.5) tone = darken(tone, 0.12);
      c.px(x, y, tone);
    }
  }
  // ribs
  for (const k of [-3, -1, 1, 3])
    c.line(cx, top, cx + k * 11, top + 23, darken(CANVAS_BEIGE, 0.22), 0.8);
  // valance with scallops and a printed band
  for (let x = cx - 44; x <= cx + 44; x++) {
    const scallop = (x - cx + 44) % 11 < 9 ? 1 : 0;
    c.rect(
      x,
      top + 24,
      1,
      5 + scallop,
      x > cx + 22 ? darken(CANVAS_BEIGE, 0.14) : darken(CANVAS_BEIGE, 0.05),
    );
  }
  c.rect(cx - 44, top + 25, 89, 1, '#2f5a47');
  smallText(c, 'LA MURALLA', cx - 19, top + 14, darken(CANVAS_BEIGE, 0.35));
  // finial
  c.rect(cx - 1, top - 4, 3, 4, '#b9a37a');
  c.outline(0.55);
  return { canvas: c, anchorX: cx, anchorY: base };
}

function windbreakFront(width) {
  const h = 36;
  const c = new Canvas(width, h);
  const base = h - 1;
  const alu = '#a9afb6';
  for (let x = 0; x < width; x++) {
    for (let y = 6; y < base - 4; y++) {
      // tinted glass: see-through, faint sky reflection at the top
      const t = (y - 6) / (base - 10);
      c.px(x, y, mix('#cfe3ea', '#9fbac4', t), 0.28);
    }
  }
  // reflection streaks
  for (let x = 4; x < width; x += 23) {
    for (let k = 0; k < 18; k++) {
      c.px(x + Math.floor(k * 0.5), 8 + k, '#ffffff', 0.45);
      c.px(x + 3 + Math.floor(k * 0.5), 8 + k, '#ffffff', 0.25);
    }
  }
  // printed band on the glass
  c.rect(0, 18, width, 1, '#2f5a47', 0.35);
  // rails and posts
  c.rect(0, 5, width, 2, alu).rect(0, 5, width, 1, lighten(alu, 0.4));
  c.rect(0, base - 4, width, 4, darken(alu, 0.15)).rect(0, base - 4, width, 1, lighten(alu, 0.3));
  c.rect(0, base, width, 1, darken(alu, 0.5));
  for (let x = 0; x < width; x += 32)
    c.rect(x, 5, 2, base - 5, alu).rect(x + 1, 5, 1, base - 5, darken(alu, 0.25));
  c.rect(width - 2, 5, 2, base - 5, alu).rect(width - 1, 5, 1, base - 5, darken(alu, 0.25));
  return { canvas: c, anchorX: 0, anchorY: base };
}

/** A 16 px run of the side screen, seen almost edge-on. */
function windbreakSide() {
  const w = 6;
  const run = 16;
  const h = run + 30;
  const c = new Canvas(w, h);
  const alu = '#a9afb6';
  for (let y = 0; y < h; y++) c.rect(1, y, 3, 1, '#b9d3dc', 0.35);
  for (let y = 0; y < h; y++) c.px(2, y, '#ffffff', 0.25);
  c.rect(0, 0, 5, 2, alu).rect(0, 0, 5, 1, lighten(alu, 0.4));
  c.rect(0, 0, 2, h, alu).rect(4, 0, 1, h, darken(alu, 0.3));
  c.rect(0, h - 4, 5, 4, darken(alu, 0.15));
  return { canvas: c, anchorX: 2, anchorY: h - 1 };
}

// ---------------------------------------------------------------- street furniture

function board() {
  const c = new Canvas(22, 32);
  const wood = '#8a5a36';
  // A-frame legs
  c.line(3, 30, 6, 2, darken(wood, 0.2)).line(18, 30, 15, 2, darken(wood, 0.2));
  c.rect(4, 2, 14, 24, wood).rect(4, 2, 14, 1, lighten(wood, 0.3));
  c.rect(6, 4, 10, 20, '#2b3230');
  smallText(c, 'HOY', 7, 6, '#f2efe6');
  c.rect(7, 12, 8, 1, '#f2efe6', 0.6)
    .rect(7, 15, 6, 1, '#f2efe6', 0.6)
    .rect(7, 18, 7, 1, '#f2efe6', 0.6);
  c.px(14, 21, '#e8a0a0').px(13, 21, '#e8a0a0');
  c.outline(0.5);
  return { canvas: c, anchorX: 11, anchorY: 30 };
}

function bollard(marked) {
  const c = new Canvas(14, 24);
  const iron = '#3d3a44';
  const tilt = marked ? 1 : 0;
  for (let y = 4; y < 22; y++) {
    const off = marked ? Math.floor((22 - y) / 9) * tilt : 0;
    c.rect(4 + off, y, 6, 1, iron)
      .px(4 + off, y, lighten(iron, 0.35))
      .px(9 + off, y, darken(iron, 0.3));
  }
  const off = marked ? 2 : 0;
  c.ellipse(7 + off, 4, 3.5, 2.5, iron).px(5 + off, 3, lighten(iron, 0.5));
  c.rect(3, 21, 8, 2, darken(iron, 0.2));
  c.rect(4 + (marked ? 1 : 0), 8, 6, 2, '#c9a24a');
  if (marked) {
    // scuffs and a round sticker someone left there
    c.rect(5, 14, 3, 3, '#f2efe6').px(6, 15, '#d8483f');
    c.px(8, 17, '#8a8690').px(9, 12, '#8a8690');
  }
  c.outline(0.5);
  return { canvas: c, anchorX: 7, anchorY: 22 };
}

function bench() {
  const c = new Canvas(48, 30);
  const wood = '#b07a45';
  const iron = '#34333a';
  // backrest (seen from the front, slightly from above)
  for (let k = 0; k < 3; k++)
    c.rect(3, 3 + k * 4, 42, 3, k % 2 ? wood : lighten(wood, 0.1)).rect(
      3,
      5 + k * 4,
      42,
      1,
      darken(wood, 0.3),
    );
  // seat slats
  for (let k = 0; k < 3; k++)
    c.rect(2, 15 + k * 3, 44, 2, lighten(wood, 0.15 - k * 0.07)).rect(
      2,
      17 + k * 3,
      44,
      1,
      darken(wood, 0.35),
    );
  // cast iron sides
  for (const x of [4, 41]) c.rect(x, 2, 3, 26, iron).px(x, 2, lighten(iron, 0.4));
  c.rect(3, 26, 5, 2, iron).rect(40, 26, 5, 2, iron);
  c.outline(0.5);
  return { canvas: c, anchorX: 24, anchorY: 28 };
}

function bin() {
  const c = new Canvas(16, 28);
  const body = '#4f5f58';
  c.rect(3, 6, 10, 19, body)
    .rect(3, 6, 2, 19, lighten(body, 0.25))
    .rect(11, 6, 2, 19, darken(body, 0.3));
  for (let y = 9; y < 24; y += 4) c.rect(3, y, 10, 1, darken(body, 0.2));
  c.rect(2, 4, 12, 3, darken(body, 0.15)).rect(2, 4, 12, 1, lighten(body, 0.3));
  c.rect(6, 1, 4, 3, '#8f959c'); // ashtray cap
  c.rect(4, 25, 8, 2, darken(body, 0.4));
  c.rect(5, 12, 6, 5, '#e6e0d6').rect(6, 13, 4, 1, body).rect(6, 15, 4, 1, body);
  c.outline(0.5);
  return { canvas: c, anchorX: 8, anchorY: 26 };
}

function gull(frame) {
  const c = new Canvas(18, 16);
  const white = '#f4f2ee';
  const grey = '#9ea6b0';
  c.ellipse(8, 9, 6, 3.8, white);
  c.rect(3, 7, 10, 3, grey).rect(3, 7, 10, 1, lighten(grey, 0.3));
  c.rect(1, 8, 3, 2, '#2c2a30'); // wing tips
  const hx = frame === 1 ? 13 : 12;
  const hy = frame === 1 ? 3 : 4;
  c.ellipse(hx, hy + 1, 2.8, 2.6, white);
  c.px(hx + 1, hy, '#1c1518');
  c.rect(hx + 3, hy + 1, 2, 1, '#e8b53a').px(hx + 3, hy + 2, '#d8483f');
  c.rect(6, 13, 1, 2, '#e3a07a').rect(9, 13, 1, 2, '#e3a07a');
  c.outline(0.5);
  return { canvas: c, anchorX: 8, anchorY: 14 };
}

function pot() {
  const c = new Canvas(18, 28);
  const terracotta = '#b8653e';
  c.rect(3, 16, 12, 10, terracotta)
    .rect(3, 16, 2, 10, lighten(terracotta, 0.25))
    .rect(13, 16, 2, 10, darken(terracotta, 0.3));
  c.rect(2, 15, 14, 2, lighten(terracotta, 0.15));
  const leaf = ['#2f5a33', '#3f7440', '#56904a', '#7aae58'];
  for (let y = 1; y < 17; y++) {
    for (let x = 1; x < 17; x++) {
      const dx = (x + 0.5 - 9) / 7.5;
      const dy = (y + 0.5 - 9) / 8;
      if (dx * dx + dy * dy > 1 - noise(x, y, 61) * 0.2) continue;
      const k = Math.max(0, Math.min(3, Math.round(1.5 - dx - dy + (bayer(x, y) - 0.5))));
      c.px(x, y, leaf[k]);
    }
  }
  c.outline(0.5);
  return { canvas: c, anchorX: 9, anchorY: 26 };
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
    tableSet: tableSet(true),
    tableSetFolded: tableSet(false),
    windbreakWest: windbreakFront(westRun),
    windbreakEast: windbreakFront(eastRun),
    windbreakSide: windbreakSide(),
    board: board(),
    bollard: bollard(false),
    bollardMarked: bollard(true),
    bench: bench(),
    bin: bin(),
    gull: strip([gull(0), gull(1)]),
    pot: pot(),
  };
}
