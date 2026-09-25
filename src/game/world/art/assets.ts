import MANIFEST from '../../../assets/world/muralla/manifest.json';
import type { Facing } from '../types';

/**
 * World art is raster PNG in `src/assets/world/muralla/` described by
 * `manifest.json` (frame size, ground anchor, status). Files are picked up by
 * name, so replacing a PNG (e.g. approved art over a placeholder) needs no
 * code change. The runtime only blits images.
 */
export interface SpriteInfo {
  file: string;
  /** `placeholder` until approved external art replaces the file. */
  status: string;
  /** Contract: sprites need an alpha background, full-frame images are opaque. */
  transparent: boolean;
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  rows: number;
  /** Ground contact point inside one frame. */
  anchorX: number;
  anchorY: number;
}

export const SPRITES: Readonly<Record<string, SpriteInfo>> = MANIFEST.sprites;

const FILES = import.meta.glob<string>('../../../assets/world/muralla/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** Sprite id → URL of its PNG (keyed by the manifest's file name). */
export const SPRITE_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(SPRITES).flatMap(([id, info]) => {
    const url = Object.entries(FILES).find(([path]) => path.endsWith(`/${info.file}`))?.[1];
    return url ? [[id, url]] : [];
  }),
);

/** Character sheets: rows = directions, columns = idle + two steps. */
export const CHARACTER_ROWS: Readonly<Record<Facing, number>> = {
  down: 0,
  up: 1,
  right: 2,
  left: 3,
};

export type SpriteImages = ReadonlyMap<string, HTMLImageElement>;

/**
 * Describes a mismatch between a decoded image and its manifest entry, or
 * null. A wrong-sized PNG would otherwise be sliced into garbled frames.
 */
export function spriteSizeProblem(id: string, width: number, height: number): string | null {
  const info = SPRITES[id];
  if (!info) return `Unknown sprite: ${id}`;
  if (width === info.width && height === info.height) return null;
  return `Sprite "${id}" is ${width}×${height}, manifest expects ${info.width}×${info.height}`;
}

/** Loads every sprite once; resolves when all images are decoded. */
export function loadSpriteImages(
  ids: Iterable<string> = Object.keys(SPRITE_URLS),
): Promise<SpriteImages> {
  const entries = [...new Set(ids)].map(async (id) => {
    const url = SPRITE_URLS[id];
    if (!url) throw new Error(`Unknown sprite: ${id}`);
    const img = new Image();
    img.src = url;
    await img.decode();
    const problem = spriteSizeProblem(id, img.naturalWidth, img.naturalHeight);
    if (problem) console.error(problem);
    return [id, img] as const;
  });
  return Promise.all(entries).then((list) => new Map(list));
}
