/**
 * Reusable compositing layer (VISUAL MASTER PACK pass). Nothing here draws
 * new art: it only lights, shades and grades the approved sprites and
 * backgrounds so characters sit INSIDE the painted scene instead of on top
 * of it.
 *
 *  - lit sprites: warm key tint, ambient occlusion towards the feet and a
 *    one-pixel rim on the sun side, cached per frame
 *  - cast shadow: the sprite's own silhouette, flattened and skewed along
 *    the scene's light direction
 *  - contact shadow: soft radial occlusion under the feet
 *  - grade: vignette + light wash over a whole frame
 *
 * All helpers take a 2D context in logical (world) units.
 */

export interface SceneLight {
  /** Key tint multiplied into sprites (golden hour, streetlamp, night...). */
  tint: string;
  /** Strength of the tint, 0..1. */
  tintAlpha: number;
  /** Rim colour on the side facing the light. */
  rim: string;
  rimAlpha: number;
  /** Which silhouette edge catches the light. */
  rimSide: 'left' | 'right';
  /** Darkening towards the feet (ambient occlusion), 0..1. */
  occlusion: number;
  /** Cast shadow colour + alpha. */
  shadow: string;
  shadowAlpha: number;
  /** Horizontal lean of the cast shadow per px of sprite height (neg = left). */
  shadowSkew: number;
  /** Vertical squash of the cast shadow (0..1; it falls towards the viewer). */
  shadowLength: number;
}

/** La Muralla, late afternoon: low sun behind the terrace, shadows fall towards camera-left. */
export const GOLDEN_HOUR: SceneLight = {
  tint: 'rgb(255 176 112)',
  tintAlpha: 0.55,
  rim: 'rgb(255 214 140)',
  rimAlpha: 0.9,
  rimSide: 'right',
  occlusion: 0.3,
  shadow: 'rgb(58 30 44)',
  shadowAlpha: 0.42,
  shadowSkew: -0.55,
  shadowLength: 0.34,
};

/** Seafront sunset (reveal / date gate / ending): sun low over the bay. */
export const SEAFRONT_SUNSET: SceneLight = {
  tint: 'rgb(255 150 120)',
  tintAlpha: 0.55,
  rim: 'rgb(255 205 150)',
  rimAlpha: 0.8,
  rimSide: 'left',
  occlusion: 0.32,
  shadow: 'rgb(40 24 52)',
  shadowAlpha: 0.38,
  shadowSkew: 0.6,
  shadowLength: 0.3,
};

/** La Muralla at night (DESYNC): cool ambient, warm lamp rim. */
export const LAMPLIT_NIGHT: SceneLight = {
  tint: 'rgb(90 110 190)',
  tintAlpha: 0.6,
  rim: 'rgb(255 205 130)',
  rimAlpha: 0.7,
  rimSide: 'right',
  occlusion: 0.35,
  shadow: 'rgb(8 10 26)',
  shadowAlpha: 0.45,
  shadowSkew: -0.4,
  shadowLength: 0.28,
};

export interface SpriteFrame {
  img: CanvasImageSource;
  sx: number;
  sy: number;
  w: number;
  h: number;
}

type Offscreen = HTMLCanvasElement | OffscreenCanvas;

function makeCanvas(w: number, h: number): Offscreen {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function ctx2d(c: Offscreen) {
  return c.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

/** Silhouette of a frame filled with one colour. */
function silhouette(f: SpriteFrame, color: string, dx = 0): Offscreen {
  const c = makeCanvas(f.w, f.h);
  const g = ctx2d(c);
  g.imageSmoothingEnabled = false;
  g.drawImage(f.img, f.sx, f.sy, f.w, f.h, dx, 0, f.w, f.h);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, f.w, f.h);
  return c;
}

/** Lit copy of one sprite frame (tint + occlusion + rim). */
export function lightFrame(f: SpriteFrame, light: SceneLight): Offscreen {
  const c = makeCanvas(f.w, f.h);
  const g = ctx2d(c);
  g.imageSmoothingEnabled = false;
  g.drawImage(f.img, f.sx, f.sy, f.w, f.h, 0, 0, f.w, f.h);

  // Key tint: multiply the scene's light colour into the sprite (hits the
  // brights hardest, like real coloured light), then restore the alpha mask.
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = light.tintAlpha;
  g.fillStyle = light.tint;
  g.fillRect(0, 0, f.w, f.h);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(f.img, f.sx, f.sy, f.w, f.h, 0, 0, f.w, f.h);
  g.globalCompositeOperation = 'source-atop';

  // Ambient occlusion: the lower body sits in the ground's shade.
  g.globalAlpha = 1;
  const ao = g.createLinearGradient(0, f.h * 0.45, 0, f.h);
  ao.addColorStop(0, 'rgb(40 24 48 / 0)');
  ao.addColorStop(1, `rgb(40 24 48 / ${light.occlusion})`);
  g.fillStyle = ao;
  g.fillRect(0, 0, f.w, f.h);

  // Rim: pixels whose neighbour on the light side is empty.
  const rim = silhouette(f, light.rim);
  const rg = ctx2d(rim);
  rg.globalCompositeOperation = 'destination-out';
  rg.drawImage(f.img, f.sx, f.sy, f.w, f.h, light.rimSide === 'right' ? -1 : 1, 0, f.w, f.h);
  // Rim fades out towards the feet (the light is low and warm, from above).
  rg.globalCompositeOperation = 'destination-in';
  const fade = rg.createLinearGradient(0, 0, 0, f.h);
  fade.addColorStop(0, 'rgb(0 0 0 / 1)');
  fade.addColorStop(0.75, 'rgb(0 0 0 / 0.35)');
  fade.addColorStop(1, 'rgb(0 0 0 / 0)');
  rg.fillStyle = fade;
  rg.fillRect(0, 0, f.w, f.h);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = light.rimAlpha;
  g.drawImage(rim, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * Per-frame cache of lit sprites and shadow silhouettes. Frames are keyed by
 * sprite id + source rect, so the cost is paid once per frame of animation.
 */
export function createLitCache(light: SceneLight) {
  const lit = new Map<string, Offscreen>();
  const shade = new Map<string, Offscreen>();
  const key = (id: string, f: SpriteFrame) => `${id}:${f.sx}:${f.sy}`;
  return {
    light,
    lit(id: string, f: SpriteFrame) {
      const k = key(id, f);
      let c = lit.get(k);
      if (!c) lit.set(k, (c = lightFrame(f, light)));
      return c;
    },
    shadow(id: string, f: SpriteFrame) {
      const k = key(id, f);
      let c = shade.get(k);
      if (!c) shade.set(k, (c = silhouette(f, light.shadow)));
      return c;
    },
  };
}
export type LitCache = ReturnType<typeof createLitCache>;

type Ctx = CanvasRenderingContext2D;

/** Soft occlusion blob right under the feet. */
export function contactShadow(ctx: Ctx, x: number, y: number, rx: number, alpha = 0.42) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.32);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgb(30 16 30 / ${alpha})`);
  g.addColorStop(0.6, `rgb(30 16 30 / ${alpha * 0.55})`);
  g.addColorStop(1, 'rgb(30 16 30 / 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * The sprite's own silhouette laid on the ground along the light direction.
 * (ax, ay) is the sprite anchor inside the frame; (x, y) the foot point.
 */
export function castShadow(
  ctx: Ctx,
  sil: CanvasImageSource,
  anchor: { x: number; y: number },
  x: number,
  y: number,
  light: SceneLight,
) {
  ctx.save();
  ctx.globalAlpha = light.shadowAlpha;
  // x' = x + skew·(−y);  y' = length·(−y) — flipped so it falls towards the viewer.
  ctx.transform(1, 0, -light.shadowSkew, -light.shadowLength, Math.round(x), Math.round(y));
  ctx.drawImage(sil, -anchor.x, -anchor.y);
  ctx.restore();
}

/** Lit sprite with cast + contact shadow, anchored at its feet. */
export function drawLitCharacter(
  ctx: Ctx,
  cache: LitCache,
  id: string,
  f: SpriteFrame,
  anchor: { x: number; y: number },
  x: number,
  y: number,
) {
  const k = f.w / 40;
  castShadow(ctx, cache.shadow(id, f), anchor, x, y, cache.light);
  contactShadow(ctx, x, y, 11 * k);
  ctx.drawImage(cache.lit(id, f), Math.round(x) - anchor.x, Math.round(y) - anchor.y);
}

export interface GradeOptions {
  /** Warm light colour washed in from one side. */
  wash: string;
  washAlpha: number;
  /** Wash origin as fractions of the frame. */
  washFrom: [number, number];
  /** Edge darkening, 0..1. */
  vignette: number;
}

const gradeLayers = new Map<string, Offscreen>();

/**
 * Pre-rendered grade (light wash + vignette) at logical size. Gradients are
 * rasterised once; every frame only blits the result.
 */
function gradeLayer(w: number, h: number, opts: GradeOptions): Offscreen {
  const key = `${w}x${h}:${opts.wash}:${opts.washAlpha}:${opts.washFrom.join(',')}:${opts.vignette}`;
  let c = gradeLayers.get(key);
  if (c) return c;
  c = makeCanvas(w, h);
  const g = ctx2d(c);
  const [wx, wy] = opts.washFrom;
  const wash = g.createRadialGradient(wx * w, wy * h, 0, wx * w, wy * h, Math.max(w, h));
  wash.addColorStop(0, opts.wash);
  wash.addColorStop(1, 'rgb(0 0 0 / 0)');
  g.globalAlpha = opts.washAlpha;
  g.fillStyle = wash;
  g.fillRect(0, 0, w, h);
  g.globalAlpha = 1;
  const v = g.createRadialGradient(w / 2, h * 0.55, h * 0.45, w / 2, h * 0.55, w * 0.62);
  v.addColorStop(0, 'rgb(20 10 24 / 0)');
  v.addColorStop(1, `rgb(20 10 24 / ${opts.vignette})`);
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);
  gradeLayers.set(key, c);
  return c;
}

/** Full-frame grade: light wash from one side + vignette (one cached blit). */
export function gradeFrame(ctx: Ctx, w: number, h: number, opts: GradeOptions) {
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(gradeLayer(w, h, opts), 0, 0, w, h);
  ctx.imageSmoothingEnabled = smooth;
}
