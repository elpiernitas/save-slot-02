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
          if (
            !Number.isInteger(value) ||
            value < 0 ||
            (key !== 'anchorX' && key !== 'anchorY' && value === 0)
          ) {
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
          // Alpha contract: sprites need real transparency, full-frame images none.
          let transparentPixels = 0;
          for (let i = 3; i < png.rgba.length; i += 4) if (png.rgba[i] < 255) transparentPixels++;
          if (info.transparent === true && transparentPixels === 0) {
            fail(`${prefix}: must have a transparent background (no alpha found)`);
          }
          if (info.transparent === false && transparentPixels > 0) {
            fail(`${prefix}: must be fully opaque (${transparentPixels} transparent px)`);
          }
          if (typeof info.transparent !== 'boolean')
            fail(`${prefix}: transparent must be true/false`);
          if (info.status !== 'placeholder' && info.status !== 'final') {
            fail(`${prefix}: status must be "placeholder" or "final"`);
          }
        } catch (error) {
          fail(
            `${prefix}: PNG failed to decode: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (Object.keys(sprites).length === 0) fail('manifest has no sprites');
      if (!failures) {
        console.log(`art: validated ${Object.keys(sprites).length} runtime sprites`);
        checkLayers(sprites);
      }
    }
  }
}

/**
 * La Muralla layer contract (RC-FIX-04): ENV (background), WORLD props
 * (occ* + world*) and FG-001 (foreground) are disjoint masks of ENV-001 and
 * recompose it pixel for pixel. Nothing is drawn twice, nothing invented.
 */
function checkLayers(sprites) {
  const source = join(root, 'tools/art/source/env-001-full.png');
  if (!existsSync(source)) return fail('layers: missing tools/art/source/env-001-full.png');
  const full = decodePng(readFileSync(source));
  const { width: W, height: H } = full;
  const out = Buffer.from(decodePng(readFileSync(join(outDir, sprites.background.file))).rgba);
  const covered = new Uint8Array(W * H);
  const stamp = (file, left, top, label) => {
    const png = decodePng(readFileSync(join(outDir, file)));
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const a = png.rgba[(y * png.width + x) * 4 + 3];
        if (a === 0) continue;
        if (a !== 255) return fail(`layers: ${label} has partial alpha (masks must be binary)`);
        const wx = left + x;
        const wy = top + y;
        if (wx < 0 || wy < 0 || wx >= W || wy >= H) return fail(`layers: ${label} outside ENV-001`);
        const i = wy * W + wx;
        if (covered[i]++) return fail(`layers: ${label} overlaps another layer at ${wx},${wy}`);
        const j = (y * png.width + x) * 4;
        for (let c = 0; c < 4; c++) out[i * 4 + c] = png.rgba[j + c];
      }
    }
  };
  const maps = join(root, 'src/game/world/maps');
  const props = [
    ...JSON.parse(readFileSync(join(maps, 'muralla.occluders.json'), 'utf8')),
    ...JSON.parse(readFileSync(join(maps, 'muralla.world.json'), 'utf8')),
  ];
  for (const p of props) {
    const info = sprites[p.id];
    if (!info) return fail(`layers: ${p.id} missing from manifest`);
    stamp(info.file, p.x - info.anchorX, p.y - info.anchorY, p.id);
  }
  stamp(sprites.foreground.file, 0, 0, 'foreground');
  let diff = 0;
  for (let i = 0; i < W * H * 4; i++) if (out[i] !== full.rgba[i]) diff++;
  if (diff) return fail(`layers: ENV + WORLD + FG-001 differ from ENV-001 in ${diff} channels`);
  const flat = decodePng(readFileSync(join(outDir, sprites.murallaFull.file)));
  if (!Buffer.from(flat.rgba).equals(Buffer.from(full.rgba)))
    fail('layers: murallaFull is not ENV-001');
  if (!failures)
    console.log(
      `art: La Muralla layers recompose ENV-001 exactly (${props.length} props + FG-001)`,
    );
}

if (failures) process.exit(1);
