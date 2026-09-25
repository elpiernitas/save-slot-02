// Generates the world art for the La Muralla slice as PNG files.
//   node tools/art/build.mjs          write src/assets/world/muralla/*.png + manifest.json
//   node tools/art/build.mjs --check  fail if the committed files differ from the generator
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHAR_FEET_Y,
  CHAR_H,
  CHAR_W,
  PEDESTRIANS,
  PLAYER,
  WAITRESS,
  characterSheet,
} from './characters.mjs';
import { drawBackground, drawForeground } from './environment.mjs';
import { decodePng, encodePng } from './png.mjs';
import { drawProps } from './props.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const layoutPath = join(root, 'src/game/world/maps/muralla.layout.json');
const outDir = join(root, 'src/assets/world/muralla');
const check = process.argv.includes('--check');

const layout = JSON.parse(readFileSync(layoutPath, 'utf8'));

const character = (palette) => ({
  canvas: characterSheet(palette),
  anchorX: CHAR_W / 2,
  anchorY: CHAR_FEET_Y,
  frames: 3,
  rows: 4,
});

/** id → { canvas, anchorX, anchorY, frames } */
const sprites = {
  background: { canvas: drawBackground(layout), anchorX: 0, anchorY: 0, frames: 1 },
  foreground: { canvas: drawForeground(layout), anchorX: 0, anchorY: 0, frames: 1 },
  player: character(PLAYER),
  waitress: character({ ...WAITRESS, tray: true }),
  ...Object.fromEntries(Object.entries(PEDESTRIANS).map(([id, p]) => [id, character(p)])),
  ...drawProps(layout),
};

const manifest = {
  generatedBy: 'tools/art/build.mjs',
  note: 'status placeholder = not approved art; replace file + set status to final',
  sprites: {},
};
let failures = 0;
if (!check) mkdirSync(outDir, { recursive: true });

// Approved art is never touched: any manifest entry with status "final"
// (e.g. PNGs delivered by ChatGPT) keeps its file and metadata as they are.
const manifestPath = join(outDir, 'manifest.json');
const previous = existsSync(manifestPath)
  ? (JSON.parse(readFileSync(manifestPath, 'utf8')).sprites ?? {})
  : {};
const finals = Object.fromEntries(
  Object.entries(previous).filter(([, info]) => info && info.status === 'final'),
);
Object.assign(manifest.sprites, finals);

for (const [id, sprite] of Object.entries(sprites)) {
  const frames = sprite.frames ?? 1;
  const rows = sprite.rows ?? 1;
  const { canvas } = sprite;
  const file = `${id}.png`;
  if (id in finals) continue;
  manifest.sprites[id] = {
    file,
    // Every generated sprite is a WIP placeholder (ASSET_IMPORT_CONTRACT.md).
    status: 'placeholder',
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

// Remove PNGs that the generator no longer produces (renamed/retired sprites).
if (!check) {
  for (const file of readdirSync(outDir)) {
    const kept = Object.values(manifest.sprites).some((info) => info.file === file);
    if (file.endsWith('.png') && !kept) rmSync(join(outDir, file));
  }
}

const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
if (check) {
  if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== manifestText) {
    console.error('out of date: manifest.json (run npm run art)');
    failures++;
  }
  if (failures) process.exit(1);
  console.log(
    `art: placeholders up to date (${Object.keys(finals).length} final sprites untouched)`,
  );
} else {
  writeFileSync(manifestPath, manifestText);
  console.log(
    `art: wrote placeholders to ${outDir} (${Object.keys(finals).length} final sprites untouched)`,
  );
}
