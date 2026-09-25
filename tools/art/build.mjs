// Generates the world art for the La Muralla slice as PNG files.
//   node tools/art/build.mjs          write src/assets/world/muralla/*.png + manifest.json
//   node tools/art/build.mjs --check  fail if the committed files differ from the generator
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAR_FEET_Y, CHAR_H, CHAR_W, PLAYER, WAITRESS, characterSheet } from './characters.mjs';
import { drawBackground } from './environment.mjs';
import { decodePng, encodePng } from './png.mjs';
import { drawProps } from './props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const layoutPath = join(root, 'src/game/world/maps/muralla.layout.json');
const outDir = join(root, 'src/assets/world/muralla');
const check = process.argv.includes('--check');

const layout = JSON.parse(readFileSync(layoutPath, 'utf8'));

/** id → { canvas, anchorX, anchorY, frames } */
const sprites = {
  background: { canvas: drawBackground(layout), anchorX: 0, anchorY: 0, frames: 1 },
  player: {
    canvas: characterSheet(PLAYER),
    anchorX: CHAR_W / 2,
    anchorY: CHAR_FEET_Y,
    frames: 3,
    rows: 4,
  },
  waitress: {
    canvas: characterSheet(WAITRESS),
    anchorX: CHAR_W / 2,
    anchorY: CHAR_FEET_Y,
    frames: 3,
    rows: 4,
  },
  ...drawProps(layout),
};

const manifest = { generatedBy: 'tools/art/build.mjs', sprites: {} };
let failures = 0;
if (!check) mkdirSync(outDir, { recursive: true });

for (const [id, sprite] of Object.entries(sprites)) {
  const frames = sprite.frames ?? 1;
  const rows = sprite.rows ?? 1;
  const { canvas } = sprite;
  const file = `${id}.png`;
  manifest.sprites[id] = {
    file,
    width: canvas.w,
    height: canvas.h,
    frameWidth: canvas.w / frames,
    frameHeight: rows === 1 ? canvas.h : CHAR_H,
    frames,
    rows,
    anchorX: sprite.anchorX,
    anchorY: sprite.anchorY,
  };
  const path = join(outDir, file);
  if (check) {
    if (!existsSync(path)) {
      console.error(`missing ${file}`);
      failures++;
      continue;
    }
    const committed = decodePng(readFileSync(path));
    const same =
      committed.width === canvas.w &&
      committed.height === canvas.h &&
      Buffer.compare(Buffer.from(committed.rgba), Buffer.from(canvas.data)) === 0;
    if (!same) {
      console.error(`out of date: ${file} (run npm run art)`);
      failures++;
    }
  } else {
    writeFileSync(path, encodePng(canvas.w, canvas.h, canvas.data));
  }
}

const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
const manifestPath = join(outDir, 'manifest.json');
if (check) {
  if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== manifestText) {
    console.error('out of date: manifest.json (run npm run art)');
    failures++;
  }
  if (failures) process.exit(1);
  console.log(`art: ${Object.keys(sprites).length} sprites up to date`);
} else {
  writeFileSync(manifestPath, manifestText);
  console.log(`art: wrote ${Object.keys(sprites).length} sprites to ${outDir}`);
}
