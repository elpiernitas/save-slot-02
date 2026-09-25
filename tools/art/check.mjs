// Validates runtime raster assets without requiring them to match the
// procedural placeholder generator pixel-for-pixel.
//
// This is intentionally different from build.mjs --check:
// approved external/hand-authored PNGs are allowed to replace generated art.
// CI cares that the manifest is internally valid and the runtime files decode
// with the declared dimensions.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './png.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = join(root, 'src/assets/world/muralla');
const manifestPath = join(outDir, 'manifest.json');

let failures = 0;
const fail = (message) => {
  console.error(message);
  failures++;
};

if (!existsSync(manifestPath)) {
  fail('missing src/assets/world/muralla/manifest.json');
} else {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    fail(`invalid manifest.json: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (manifest) {
    const sprites = manifest.sprites;
    if (!sprites || typeof sprites !== 'object' || Array.isArray(sprites)) {
      fail('manifest.sprites must be an object');
    } else {
      const files = new Set();
      for (const [id, info] of Object.entries(sprites)) {
        const prefix = `sprite "${id}"`;
        if (!info || typeof info !== 'object') {
          fail(`${prefix}: invalid manifest entry`);
          continue;
        }

        const requiredInts = [
          'width',
          'height',
          'frameWidth',
          'frameHeight',
          'frames',
          'rows',
          'anchorX',
          'anchorY',
        ];
        for (const key of requiredInts) {
          const value = info[key];
          if (!Number.isInteger(value) || value < 0 || (key !== 'anchorX' && key !== 'anchorY' && value === 0)) {
            fail(`${prefix}: ${key} must be a valid integer`);
          }
        }

        if (typeof info.file !== 'string' || !info.file.endsWith('.png')) {
          fail(`${prefix}: file must be a .png filename`);
          continue;
        }
        if (files.has(info.file)) fail(`${prefix}: duplicate file "${info.file}"`);
        files.add(info.file);

        if (info.frameWidth * info.frames !== info.width) {
          fail(`${prefix}: frameWidth × frames must equal width`);
        }
        if (info.frameHeight * info.rows !== info.height) {
          fail(`${prefix}: frameHeight × rows must equal height`);
        }
        if (info.anchorX > info.frameWidth || info.anchorY > info.frameHeight) {
          fail(`${prefix}: anchor must fit inside one frame`);
        }

        const path = join(outDir, info.file);
        if (!existsSync(path)) {
          fail(`${prefix}: missing ${info.file}`);
          continue;
        }
        try {
          const png = decodePng(readFileSync(path));
          if (png.width !== info.width || png.height !== info.height) {
            fail(
              `${prefix}: PNG is ${png.width}×${png.height}, manifest says ${info.width}×${info.height}`,
            );
          }
        } catch (error) {
          fail(`${prefix}: PNG failed to decode: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (Object.keys(sprites).length === 0) fail('manifest has no sprites');
      if (!failures) {
        console.log(`art: validated ${Object.keys(sprites).length} runtime sprites`);
      }
    }
  }
}

if (failures) process.exit(1);
