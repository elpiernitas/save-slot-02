// Cuts occluder sprites out of the final ENV-001 background.
//
// ENV-001 paints the sidewalk furniture into the background. PLAYER 1 can
// walk behind some of it (lamp, bollards, bin, board, flower pot), so those
// pieces are re-drawn on top of him as y-sorted sprites. Each sprite is the
// exact ENV-001 pixels inside a traced outline, placed where it was cut, so
// when PLAYER 1 is not behind it it is pixel-identical to the background.
// No new art: only a mask over ChatGPT's pixels.
//
// Usage: node tools/art/occluders.mjs  (rewrites the occ*.png sprites and
// their manifest entries; the background must be the final ENV-001).
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { decodePng, encodePng } from './png.mjs';

const DIR = 'src/assets/world/muralla';
const MANIFEST = `${DIR}/manifest.json`;
const PLACEMENTS = 'src/game/world/maps/muralla.occluders.json';

/**
 * Outline of each piece of sidewalk furniture PLAYER 1 can walk behind,
 * traced on ENV-001 in world px (polygon, clockwise). `baseY` = where it
 * touches the ground (depth-sort anchor). The flower pot by the bench is
 * included since RC-FIX-03: an audit of reachable positions showed PLAYER 1
 * can stand just behind its foliage (feet x ≤ 690, y 304–322).
 */
export const OCCLUDERS = [
  {
    id: 'occPot',
    baseY: 322,
    outline: [
      [702, 284],
      [724, 284],
      [724, 324],
      [705, 324],
      [705, 306],
      [699, 306],
      [699, 289],
    ],
  },
  {
    id: 'occLamp',
    baseY: 318,
    outline: [
      [193, 176],
      [209, 176],
      [209, 250],
      [213, 250],
      [213, 285],
      [217, 285],
      [217, 322],
      [181, 322],
      [181, 285],
      [187, 285],
      [187, 250],
      [193, 250],
    ],
  },
  {
    id: 'occBoard',
    baseY: 292,
    outline: [
      [104, 197],
      [153, 197],
      [164, 293],
      [95, 293],
    ],
  },
  {
    id: 'occBollardWest',
    baseY: 332,
    outline: [
      [373, 269],
      [390, 269],
      [390, 310],
      [395, 310],
      [395, 333],
      [369, 333],
      [369, 310],
      [373, 310],
    ],
  },
  {
    id: 'occBollardMid',
    baseY: 350,
    outline: [
      [535, 284],
      [551, 284],
      [551, 300],
      [555, 300],
      [555, 352],
      [531, 352],
      [531, 300],
      [535, 300],
    ],
  },
  {
    id: 'occBollardEast',
    baseY: 355,
    outline: [
      [847, 308],
      [868, 308],
      [868, 357],
      [847, 357],
    ],
  },
  {
    id: 'occGullWest',
    baseY: 304,
    outline: [
      [158, 291],
      [166, 287],
      [172, 292],
      [178, 302],
      [175, 306],
      [158, 306],
    ],
  },
  {
    id: 'occGullEast',
    baseY: 350,
    outline: [
      [749, 327],
      [759, 322],
      [768, 333],
      [783, 344],
      [777, 352],
      [750, 352],
      [746, 340],
    ],
  },
  {
    id: 'occBin',
    baseY: 352,
    outline: [
      [620, 271],
      [669, 271],
      [669, 353],
      [620, 353],
    ],
  },
];

/** Even-odd point-in-polygon test at the pixel centre. */
function inside(outline, px, py) {
  let hit = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i];
    const [xj, yj] = outline[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function cut(bg, o) {
  const xs = o.outline.map((p) => p[0]);
  const ys = o.outline.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const w = Math.max(...xs) - x0;
  const h = Math.max(...ys) - y0;
  const rgba = new Uint8Array(w * h * 4);
  let pixels = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(o.outline, x0 + x + 0.5, y0 + y + 0.5)) continue;
      const i = ((y0 + y) * bg.width + x0 + x) * 4;
      rgba.set(bg.rgba.subarray(i, i + 3), (y * w + x) * 4);
      rgba[(y * w + x) * 4 + 3] = 255;
      pixels++;
    }
  }
  return { x0, y0, w, h, rgba, pixels };
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
if (manifest.sprites.background?.status !== 'final') {
  throw new Error('occluders: background is not the final ENV-001');
}
// Source = the full, flattened ENV-001 (background.png is the split ENV layer).
const bg = decodePng(readFileSync('tools/art/source/env-001-full.png'));
const placements = [];
for (const o of OCCLUDERS) {
  const { x0, y0, w, h, rgba, pixels } = cut(bg, o);
  writeFileSync(`${DIR}/${o.id}.png`, encodePng(w, h, rgba));
  manifest.sprites[o.id] = {
    file: `${o.id}.png`,
    status: 'final',
    // A rectangular outline cuts a fully opaque sprite: declare it as such.
    transparent: pixels < w * h,
    width: w,
    height: h,
    frameWidth: w,
    frameHeight: h,
    frames: 1,
    rows: 1,
    anchorX: 0,
    anchorY: o.baseY - y0,
  };
  placements.push({ id: o.id, x: x0, y: o.baseY });
  console.log(`occluders: ${o.id} ${w}×${h} (${pixels} px of object) base y=${o.baseY}`);
}
for (const id of Object.keys(manifest.sprites)) {
  if (id.startsWith('occ') && !OCCLUDERS.some((o) => o.id === id)) {
    delete manifest.sprites[id];
    rmSync(`${DIR}/${id}.png`, { force: true });
  }
}
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
// Where each occluder goes in the world (read by the map).
writeFileSync(PLACEMENTS, `${JSON.stringify(placements, null, 2)}\n`);
