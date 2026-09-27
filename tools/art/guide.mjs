// Layout guides for external art production (not runtime art).
//   node tools/art/guide.mjs → docs/art/requests/*.png
// Draws the current placeholder faded, plus the geometry the runtime relies
// on: façade line, terrace, prop anchors, collision footprints, spawn.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas } from './canvas.mjs';
import { decodePng, encodePng } from './png.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const L = JSON.parse(readFileSync(join(root, 'src/game/world/maps/muralla.layout.json'), 'utf8'));
const assets = join(root, 'src/assets/world/muralla');
const out = join(root, 'docs/art/requests');
mkdirSync(out, { recursive: true });

function load(file) {
  const { width, height, rgba } = decodePng(readFileSync(join(assets, file)));
  const c = new Canvas(width, height);
  c.data.set(rgba);
  return c;
}

function frame(c, x, y, w, h, color) {
  c.rect(x, y, w, 1, color)
    .rect(x, y + h - 1, w, 1, color)
    .rect(x, y, 1, h, color)
    .rect(x + w - 1, y, 1, h, color);
}
const cross = (c, x, y, color) => c.rect(x - 3, y, 7, 1, color).rect(x, y - 3, 1, 7, color);
const foot = (x, y, w, h) => [x - w / 2, y - h, w, h];

// ---- ENV-001: world layout guide (960×400, 1:1 world px)
const bg = load('background.png');
const g = new Canvas(bg.w, bg.h);
g.blit(bg, 0, 0);
g.rect(0, 0, g.w, g.h, '#ffffff', 0.55);
g.rect(0, L.facadeBottom, g.w, 1, '#d02020'); // façade line: non-walkable above
g.rect(0, L.curbTop, g.w, 1, '#d02020'); // curb: non-walkable below
const tr = L.terrace;
frame(g, tr.x, tr.y, tr.w, tr.h, '#1060d0');
g.rect(tr.gapX, tr.y + tr.h - 2, tr.gapW, 3, '#20a040'); // entrance gap
for (const k of ['barWindowLeft', 'barDoor', 'barWindowRight', 'westDoor', 'eastDoor']) {
  frame(g, L[k].x, 60, L[k].w, L.facadeBottom - 60, '#e0a000');
}
const props = [
  ...L.tables.map((t) => [t.x, t.y, 64, 16]),
  ...L.trees.map((t) => [t.x, t.y, 20, 10]),
  ...L.planters.map((p) => [p.x, p.y, 26, 8]),
  ...L.bollards.map((b) => [b.x, b.y, 10, 6]),
  [L.bench.x, L.bench.y, 70, 12],
  [L.bike.x, L.bike.y, 58, 8],
  [L.board.x, L.board.y, 24, 6],
  [L.waitress.x, L.waitress.y, 20, 8],
];
for (const [x, y, w, h] of props) {
  const [fx, fy, fw, fh] = foot(x, y, w, h);
  g.rect(fx, fy, fw, fh, '#d02020', 0.35);
  cross(g, x, y, '#006080');
}
for (const w of L.walkers)
  g.rect(Math.max(0, w.x0), w.y, Math.min(g.w, w.x1) - Math.max(0, w.x0), 1, '#9040c0');
cross(g, 420, 346, '#20a040');
frame(g, 420 - 20, 346 - 57, 40, 60, '#20a040'); // PLAYER 1 at the arrival spawn
writeFileSync(join(out, 'env-001-layout-guide.png'), encodePng(g.w, g.h, g.data));

// ---- CHAR-001: Luis sheet guide (120×240 = 3 cols × 4 rows of 40×60)
const sheet = load('player.png');
const s = new Canvas(sheet.w, sheet.h);
s.blit(sheet, 0, 0);
s.rect(0, 0, s.w, s.h, '#ffffff', 0.5);
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 3; col++) {
    const x = col * 40;
    const y = row * 60;
    frame(s, x, y, 40, 60, '#1060d0');
    s.rect(x + 12, y + 51, 16, 6, '#d02020', 0.4); // collision feet
    s.px(x + 20, y + 57, '#20a040');
  }
}
writeFileSync(join(out, 'char-001-luis-sheet-guide.png'), encodePng(s.w, s.h, s.data));
console.log('guides written to docs/art/requests/');
