// Derives `playerLarge` from CHAR-001 (`player.png`, final) by exact 2×
// nearest-neighbour scaling: every source pixel becomes a 2×2 block, nothing
// is redrawn. La Muralla's ENV-001 paints adults ~100–110 px tall; CHAR-001
// is ~54 px, so the map shows PLAYER 1 with this copy to match the
// reference proportion. A native 80×120 CHAR-001 can replace it later.
//
// Usage: node tools/art/scale-player.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { decodePng, encodePng } from './png.mjs';

const DIR = 'src/assets/world/muralla';
const MANIFEST = `${DIR}/manifest.json`;
const SCALE = 2;

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const src = manifest.sprites.player;
if (src?.status !== 'final') throw new Error('scale-player: CHAR-001 is not final');
const p = decodePng(readFileSync(`${DIR}/${src.file}`));
const w = p.width * SCALE;
const h = p.height * SCALE;
const out = new Uint8Array(w * h * 4);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const s = (((y / SCALE) | 0) * p.width + ((x / SCALE) | 0)) * 4;
    out.set(p.rgba.subarray(s, s + 4), (y * w + x) * 4);
  }
}
writeFileSync(`${DIR}/playerLarge.png`, encodePng(w, h, out));
manifest.sprites.playerLarge = {
  file: 'playerLarge.png',
  status: 'final',
  transparent: true,
  width: w,
  height: h,
  frameWidth: src.frameWidth * SCALE,
  frameHeight: src.frameHeight * SCALE,
  frames: src.frames,
  rows: src.rows,
  anchorX: src.anchorX * SCALE,
  anchorY: src.anchorY * SCALE + (SCALE - 1),
};
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `scale-player: playerLarge ${w}×${h}, frames ${src.frameWidth * SCALE}×${src.frameHeight * SCALE}`,
);
