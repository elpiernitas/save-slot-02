/**
 * Runtime art cropped from the ChatGPT VISUAL MASTER PACK (the visual source
 * of truth). Regenerate with `tools/art/pack_crops.py`; see docs/ASSETS.md
 * for each crop's source panel.
 */
import classHealer from '../../assets/pack/class-healer.png';
import classPlayer1 from '../../assets/pack/class-player1.png';
import classSky from '../../assets/pack/class-sky.png';
import classTank from '../../assets/pack/class-tank.png';
import classWarrior from '../../assets/pack/class-warrior.png';
import manuPortrait from '../../assets/pack/manu-portrait.png';
import manu from '../../assets/pack/manu.png';
import polaroid from '../../assets/pack/polaroid.png';
import seafront from '../../assets/pack/seafront.png';

export const PACK_ART = {
  classPlayer1,
  classSky,
  classArt: { warrior: classWarrior, tank: classTank, healer: classHealer } as Readonly<
    Record<string, string>
  >,
  seafront,
  polaroid,
  manuPortrait,
} as const;

const loaded = new Map<string, Promise<HTMLImageElement>>();
/** Decoded image for canvas drawing (cached per URL). */
export function loadImage(url: string): Promise<HTMLImageElement> {
  let p = loaded.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`failed to load ${url}`));
      img.src = url;
    });
    loaded.set(url, p);
  }
  return p;
}

/** PLAYER 2 (Manu) map sprite: same grid, rows and anchor as CHAR-001 `player`. */
export const MANU_SPRITE = {
  url: manu,
  width: 120,
  height: 240,
  frameWidth: 40,
  frameHeight: 60,
  frames: 3,
  anchorX: 20,
  anchorY: 57,
} as const;
