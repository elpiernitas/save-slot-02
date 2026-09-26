/**
 * Cooperative gate room: a system floor, two switches and one door laid over
 * the sunset seafront (master pack). PLAYER 1 is CHAR-001; PLAYER 2 is Manu's
 * map sprite from 04_MANU_SPRITE_SHEET_ART_TARGET (same grid as CHAR-001).
 * Both go through the compositing layer so they share the scene's light.
 */
import { MANU_SPRITE } from '../../art/pack';
import {
  createLitCache,
  drawLitCharacter,
  gradeFrame,
  SEAFRONT_SUNSET,
} from '../../render/compositing';
import { CHARACTER_ROWS, SPRITES, type SpriteImages } from '../../world/art/assets';
import { DOOR, FLOOR, GATE_ARENA, SWITCH_1, SWITCH_2, type GateState } from './gate';

const C = {
  bg: '#0b1626',
  field: '#0e1a2c',
  grid: '#16243d',
  edge: '#3c5a82',
  cyan: '#bfeef2',
  cream: '#f4ecda',
  dim: '#5d7392',
  gold: '#f2c14e',
};

const STEP_PX = 10;

export function createGateRenderer(canvas: HTMLCanvasElement, images: SpriteImages | null) {
  const ctx = canvas.getContext('2d')!;
  const light = createLitCache(SEAFRONT_SUNSET);
  const seafront = images?.get('seafront');
  let scale = 0;
  /** Backdrop + floor, rasterised once per backing-store size. */
  let base: HTMLCanvasElement | null = null;
  let p2Walked = 0;
  let p2Last = { x: 0, y: 0 };

  const resize = (displayHeightPx: number) => {
    const next = Math.max(1, Math.ceil(displayHeightPx / GATE_ARENA.h));
    if (next === scale) return;
    scale = next;
    canvas.width = GATE_ARENA.w * scale;
    canvas.height = GATE_ARENA.h * scale;
    base = null;
  };
  resize(GATE_ARENA.h);

  const pad = (p: { x: number; y: number }, on: boolean, label: string) => {
    ctx.fillStyle = on ? C.cyan : C.field;
    ctx.strokeStyle = on ? C.cyan : C.cream;
    ctx.lineWidth = 1;
    ctx.fillRect(p.x - 12, p.y - 6, 24, 12);
    ctx.strokeRect(p.x - 11.5, p.y - 5.5, 23, 11);
    ctx.fillStyle = on ? C.cyan : C.dim;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, p.x, p.y + 18);
  };

  return {
    resize,
    draw(s: GateState, walked: number, reduced: boolean) {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.letterSpacing = '0px';
      if (!base) base = paintBase();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      // Door: two panels that slide apart when open.
      const open = s.stage === 'open' || s.stage === 'opening';
      const k = s.stage === 'open' ? 1 : s.stage === 'opening' && !reduced ? 0.5 : 0;
      const half = DOOR.w / 2;
      ctx.fillStyle = open ? C.gold : C.grid;
      ctx.fillRect(DOOR.x, DOOR.y, DOOR.w, DOOR.h);
      ctx.fillStyle = C.edge;
      ctx.fillRect(DOOR.x, DOOR.y, half * (1 - k), DOOR.h);
      ctx.fillRect(DOOR.x + DOOR.w - half * (1 - k), DOOR.y, half * (1 - k), DOOR.h);
      ctx.strokeStyle = open ? C.gold : C.cream;
      ctx.strokeRect(DOOR.x - 0.5, DOOR.y - 0.5, DOOR.w + 1, DOOR.h + 1);

      const p1On = s.stage !== 'await1';
      const p2On = s.stage === 'p2ready' || open;
      pad(SWITCH_1, p1On, 'P1');
      pad(SWITCH_2, p2On, 'P2');

      // Depth: whoever is lower on screen is drawn last.
      const actors = [
        { y: s.p1.y, draw: () => luis(s, walked) },
        { y: s.p2.y, draw: () => manu(s) },
      ].sort((a, b) => a.y - b.y);
      actors.forEach((a) => a.draw());
      gradeFrame(ctx, GATE_ARENA.w, GATE_ARENA.h, {
        wash: 'rgb(255 170 120)',
        washAlpha: 0.14,
        washFrom: [0.45, 0.25],
        vignette: 0.4,
      });
    },
  };

  function paintBase() {
    const c = document.createElement('canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    const g = c.getContext('2d')!;
    g.setTransform(scale, 0, 0, scale, 0, 0);
    if (seafront) {
      const k = Math.max(GATE_ARENA.w / seafront.width, GATE_ARENA.h / seafront.height);
      g.imageSmoothingEnabled = true;
      g.drawImage(
        seafront,
        (GATE_ARENA.w - seafront.width * k) / 2,
        GATE_ARENA.h - seafront.height * k,
        seafront.width * k,
        seafront.height * k,
      );
      g.imageSmoothingEnabled = false;
    } else {
      g.fillStyle = C.bg;
      g.fillRect(0, 0, GATE_ARENA.w, GATE_ARENA.h);
    }
    // Near foreground falls into shade so the system floor reads first.
    const shade = g.createLinearGradient(0, FLOOR.y - 40, 0, GATE_ARENA.h);
    shade.addColorStop(0, 'rgb(11 22 38 / 0)');
    shade.addColorStop(1, 'rgb(11 22 38 / 0.6)');
    g.fillStyle = shade;
    g.fillRect(0, 0, GATE_ARENA.w, GATE_ARENA.h);
    // The system floor: navy glass over the promenade.
    g.fillStyle = 'rgb(14 26 44 / 0.84)';
    g.fillRect(FLOOR.x - 20, FLOOR.y - 10, FLOOR.w + 40, FLOOR.h + 30);
    g.strokeStyle = C.grid;
    g.beginPath();
    for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += 40) {
      g.moveTo(x + 0.5, FLOOR.y - 10);
      g.lineTo(x + 0.5, FLOOR.y + FLOOR.h + 20);
    }
    g.stroke();
    g.strokeStyle = C.edge;
    g.strokeRect(FLOOR.x - 19.5, FLOOR.y - 9.5, FLOOR.w + 39, FLOOR.h + 29);
    return c;
  }

  function luis(s: GateState, walked: number) {
    const info = SPRITES.player;
    const img = images?.get('player');
    if (!img || !info) return;
    const { x, y, facing } = s.p1;
    const frame = walked > 0 ? (Math.floor(walked / STEP_PX) % 2) + 1 : 0;
    drawLitCharacter(
      ctx,
      light,
      'player',
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
  }

  /** PLAYER 2: Manu's map sprite, stepping while his route moves him. */
  function manu(s: GateState) {
    const img = images?.get('manu');
    const { x, y, facing } = s.p2;
    const moved = Math.hypot(x - p2Last.x, y - p2Last.y);
    p2Walked = moved > 0 && moved < 20 ? p2Walked + moved : 0;
    p2Last = { x, y };
    if (!img) return;
    const m = MANU_SPRITE;
    const frame = p2Walked > 0 ? (Math.floor(p2Walked / STEP_PX) % 2) + 1 : 0;
    drawLitCharacter(
      ctx,
      light,
      'manu',
      {
        img,
        sx: frame * m.frameWidth,
        sy: CHARACTER_ROWS[facing] * m.frameHeight,
        w: m.frameWidth,
        h: m.frameHeight,
      },
      { x: m.anchorX, y: m.anchorY },
      x,
      y,
    );
  }
}
