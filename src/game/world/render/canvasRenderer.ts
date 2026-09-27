import {
  createLitCache,
  drawLitCharacter,
  GOLDEN_HOUR,
  gradeFrame,
} from '../../render/compositing';
import { CHARACTER_ROWS, SPRITES, type SpriteImages } from '../art/assets';
import type { WorldSnapshot } from '../engine/WorldEngine';
import type { Facing, Walker, WorldMap } from '../types';

/**
 * Canvas 2D renderer for exploration maps. Draws at the logical world
 * resolution into a backing store scaled by an integer factor
 * (nearest-neighbour), which CSS then fits to the 16:9 stage.
 *
 * All art is pre-rendered PNG (see art/assets.ts): the background holds the
 * façades, paving and baked shadows; props, NPCs and the player are y-sorted
 * every frame by their ground anchor. Characters go through the compositing
 * layer (render/compositing.ts): lit, rim-lit, with cast + contact shadow,
 * and the finished frame gets a light grade so sprites and paint share one
 * light.
 */
export interface WorldRenderer {
  /** Adapts the backing store to the displayed canvas height (device px). */
  resize(displayHeightPx: number): void;
  draw(snapshot: WorldSnapshot): void;
  destroy(): void;
}

export function createWorldRenderer(
  canvas: HTMLCanvasElement,
  map: WorldMap,
  view: { w: number; h: number },
  images: SpriteImages,
  options: { reducedMotion: () => boolean },
): WorldRenderer {
  const ctx = canvas.getContext('2d')!;
  const light = createLitCache(GOLDEN_HOUR);
  let scale = 1;

  const resize = (displayHeightPx: number) => {
    scale = Math.max(1, Math.ceil(displayHeightPx / view.h));
    canvas.width = view.w * scale;
    canvas.height = view.h * scale;
    ctx.imageSmoothingEnabled = false;
  };
  resize(view.h);

  /** Draws one frame of a sprite with its anchor at (x, y). */
  const blit = (id: string, x: number, y: number, frame = 0, row = 0) => {
    const info = SPRITES[id];
    const img = images.get(id);
    if (!info || !img) return;
    ctx.drawImage(
      img,
      frame * info.frameWidth,
      row * info.frameHeight,
      info.frameWidth,
      info.frameHeight,
      Math.round(x) - info.anchorX,
      Math.round(y) - info.anchorY,
      info.frameWidth,
      info.frameHeight,
    );
  };

  const draw = (snap: WorldSnapshot) => {
    const { camera: cam } = snap;
    const still = options.reducedMotion();
    const frameAt = (id: string, periodMs: number | undefined) => {
      const frames = SPRITES[id]?.frames ?? 1;
      return still || !periodMs || frames < 2 ? 0 : Math.floor(snap.timeMs / periodMs) % frames;
    };

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1b1a22';
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.translate(-cam.x, -cam.y);
    const ground = images.get(map.background);
    if (ground) ctx.drawImage(ground, 0, 0);

    type Drawable = { baseY: number; draw: () => void };
    const list: Drawable[] = [];

    for (const prop of map.props) {
      list.push({
        baseY: prop.baseY ?? prop.y,
        draw: () => blit(prop.sprite, prop.x, prop.y, frameAt(prop.sprite, prop.animMs)),
      });
    }

    const character = (id: string, x: number, y: number, facing: Facing, frame: number) =>
      list.push({
        baseY: y,
        draw: () => {
          const info = SPRITES[id];
          const img = images.get(id);
          if (!info || !img) return;
          drawLitCharacter(
            ctx,
            light,
            id,
            {
              img,
              sx: frame * info.frameWidth,
              sy: CHARACTER_ROWS[facing] * info.frameHeight,
              w: info.frameWidth,
              h: info.frameHeight,
            },
            { x: info.anchorX, y: info.anchorY },
            x,
            y,
          );
        },
      });
    for (const npc of map.npcs) character(npc.sprite, npc.x, npc.y, npc.facing, 0);
    for (const walker of map.walkers ?? []) {
      const w = walkerPose(walker, still ? 0 : snap.timeMs);
      character(walker.sprite, w.x, walker.y, w.facing, still ? 0 : w.frame);
    }
    character(map.playerSprite ?? 'player', snap.pos.x, snap.pos.y, snap.facing, snap.walkFrame);

    list.sort((a, b) => a.baseY - b.baseY);
    for (const d of list) d.draw();

    // Near-camera layer over everything (foreground foliage).
    const front = map.foreground ? images.get(map.foreground) : undefined;
    if (front) ctx.drawImage(front, 0, 0);

    // Light grade in screen space: warm wash from the sun side + vignette.
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    gradeFrame(ctx, view.w, view.h, {
      wash: 'rgb(255 190 110)',
      washAlpha: 0.14,
      washFrom: [0.8, 0.1],
      vignette: 0.32,
    });
  };

  return { resize, draw, destroy: () => undefined };
}

/** Walked distance (px) per step frame, as for the player. */
const WALKER_STEP_PX = 7;

/** Ping-pong position of a background walker at a given time (pure). */
export function walkerPose(
  walker: Walker,
  timeMs: number,
): { x: number; facing: Facing; frame: 1 | 2 } {
  const range = Math.max(1, walker.x1 - walker.x0);
  const travelled = (timeMs / 1000) * walker.speed + walker.phase;
  const d = travelled % (2 * range);
  const forward = d < range;
  return {
    x: forward ? walker.x0 + d : walker.x1 - (d - range),
    facing: forward ? 'right' : 'left',
    frame: ((Math.floor(travelled / WALKER_STEP_PX) % 2) + 1) as 1 | 2,
  };
}
