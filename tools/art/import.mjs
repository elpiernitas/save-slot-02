// Imports an approved external PNG (e.g. delivered by ChatGPT) as a runtime
// sprite, after validating it against the sprite's contract in manifest.json.
//
//   npm run art:import -- <spriteId> <path/to/file.png> [--anchor X,Y]
//
// The file is decoded (any standard PNG), checked for exact size and alpha,
// re-encoded as 8-bit RGBA and written over the placeholder; the manifest
// entry is set to status "final" (npm run art never touches it again).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng } from './png.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = join(root, 'src/assets/world/muralla');
const manifestPath = join(outDir, 'manifest.json');

const [id, source, ...rest] = process.argv.slice(2);
const anchorArg = rest.includes('--anchor') ? rest[rest.indexOf('--anchor') + 1] : null;
const die = (message) => {
  console.error(`art:import: ${message}`);
  process.exit(1);
};

if (!id || !source) die('usage: npm run art:import -- <spriteId> <file.png> [--anchor X,Y]');
if (!existsSync(source)) die(`file not found: ${source}`);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const info = manifest.sprites[id];
if (!info) die(`unknown sprite "${id}" (known: ${Object.keys(manifest.sprites).join(', ')})`);

let png;
try {
  png = decodePng(readFileSync(source));
} catch (error) {
  die(`cannot decode ${source}: ${error instanceof Error ? error.message : error}`);
}

const problems = [];
if (png.width !== info.width || png.height !== info.height) {
  problems.push(
    `size is ${png.width}×${png.height}, contract is ${info.width}×${info.height} ` +
      `(${info.frames}×${info.rows} frames of ${info.frameWidth}×${info.frameHeight})`,
  );
}
let transparentPixels = 0;
for (let i = 3; i < png.rgba.length; i += 4) if (png.rgba[i] < 255) transparentPixels++;
if (info.transparent && transparentPixels === 0) problems.push('needs a transparent background');
if (!info.transparent && transparentPixels > 0) problems.push('must be fully opaque');
// Every animation frame should contain something.
if (info.transparent) {
  for (let row = 0; row < info.rows; row++) {
    for (let col = 0; col < info.frames; col++) {
      let solid = 0;
      for (let y = 0; y < info.frameHeight; y++) {
        for (let x = 0; x < info.frameWidth; x++) {
          const px = ((row * info.frameHeight + y) * png.width + col * info.frameWidth + x) * 4;
          if (png.rgba[px + 3] > 0) solid++;
        }
      }
      if (solid === 0 && png.width === info.width)
        problems.push(`frame col ${col}, row ${row} is empty`);
    }
  }
}
if (problems.length)
  die(`${source} does not meet the "${id}" contract:\n  - ${problems.join('\n  - ')}`);

if (anchorArg) {
  const [ax, ay] = anchorArg.split(',').map(Number);
  if (
    !Number.isInteger(ax) ||
    !Number.isInteger(ay) ||
    ax > info.frameWidth ||
    ay > info.frameHeight
  ) {
    die(`bad --anchor ${anchorArg}`);
  }
  info.anchorX = ax;
  info.anchorY = ay;
}
writeFileSync(join(outDir, info.file), encodePng(png.width, png.height, png.rgba));
info.status = 'final';
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `art:import: ${id} ← ${source} (${png.width}×${png.height}, anchor ${info.anchorX},${info.anchorY}) marked final`,
);
