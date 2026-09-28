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
import { FLOOR, GATE_ARENA, SWITCH_1, SWITCH_2, type GateState } from './gate';

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

  /** Ground switch: a ring on the promenade that fills with signal light. */
  const pad = (
    p: { x: number; y: number },
    on: boolean,
    reduced: boolean,
    t: number,
    tone: readonly [number, number, number] = [191, 238, 242],
  ) => {
    const rgb = tone.join(' ');
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1, 0.4);
    if (on) {
      const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(t / 220);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
      glow.addColorStop(0, `rgb(${rgb} / ${0.75 * pulse})`);
      glow.addColorStop(1, `rgb(${rgb} / 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = on ? `rgb(${rgb})` : 'rgb(244 236 218 / 0.85)';
    ctx.setLineDash(on ? [] : [4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  /** P1 / P2 tags, drawn over the actors so a player never hides them. */
  const padLabel = (p: { x: number; y: number }, on: boolean, label: string) => {
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgb(11 22 38 / 0.85)';
    ctx.fillRect(p.x - 9, p.y + 9, 18, 11);
    ctx.fillStyle = on ? C.cyan : C.cream;
    ctx.fillText(label, p.x, p.y + 17);
  };

  /** Signal line from a switch up to its half of the portal. */
  const link = (from: { x: number; y: number }, toX: number, on: boolean) => {
    ctx.strokeStyle = on ? 'rgb(191 238 242 / 0.8)' : 'rgb(244 236 218 / 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y - 6);
    ctx.lineTo(toX, PORTAL.y + PORTAL.h + 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  /**
   * The portal (audit): a tall arched frame standing on the horizon, two
   * glass halves (P1 cyan, P2 gold) through which the sunset shows, each
   * lighting up with its player's signal; when open, the halves slide apart
   * on a column of warm light with its reflection on the floor. Drawing only:
   * the gate's states, switches and timing are unchanged.
   */
  const P1_TONE = [191, 238, 242] as const;
  const P2_TONE = [242, 193, 78] as const;
  const PORTAL = { x: 262, y: 44, w: 116, h: 108 };
  const portal = (s: GateState, reduced: boolean) => {
    const p1On = s.stage !== 'await1';
    const p2On = s.stage === 'p2ready' || s.stage === 'opening' || s.stage === 'open';
    const k = s.stage === 'open' ? 1 : s.stage === 'opening' && !reduced ? 0.5 : 0;
    const { x, y, w, h } = PORTAL;
    const cx = x + w / 2;
    const r = w / 2;
    const arch = (inset: number) => {
      ctx.beginPath();
      ctx.moveTo(x + inset, y + h);
      ctx.lineTo(x + inset, y + r);
      ctx.arc(cx, y + r, r - inset, Math.PI, 0);
      ctx.lineTo(x + w - inset, y + h);
      ctx.closePath();
    };

    // Floor reflection: a soft elliptical pool, strongest once open.
    ctx.save();
    ctx.translate(cx, y + h + 26);
    ctx.scale(1, 0.28);
    const reflCol = k > 0 ? '255 214 150' : p1On || p2On ? '191 238 242' : '244 236 218';
    const pool = ctx.createRadialGradient(0, 0, 4, 0, 0, w * 0.8);
    pool.addColorStop(0, `rgb(${reflCol} / ${k > 0 ? 0.55 : 0.16})`);
    pool.addColorStop(1, 'rgb(0 0 0 / 0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Column of light (open only): soft, layered, reaching into the sky.
    if (k > 0) {
      const beamW = w * 0.55 * k;
      const beam = ctx.createLinearGradient(cx - beamW, 0, cx + beamW, 0);
      beam.addColorStop(0, 'rgb(255 214 150 / 0)');
      beam.addColorStop(0.35, 'rgb(255 222 170 / 0.55)');
      beam.addColorStop(0.5, 'rgb(255 248 228 / 0.95)');
      beam.addColorStop(0.65, 'rgb(255 222 170 / 0.55)');
      beam.addColorStop(1, 'rgb(255 214 150 / 0)');
      ctx.fillStyle = beam;
      ctx.fillRect(cx - beamW, 0, beamW * 2, y + h);
      const halo = ctx.createRadialGradient(cx, y + h * 0.6, 4, cx, y + h * 0.6, 110);
      halo.addColorStop(0, 'rgb(255 230 180 / 0.55)');
      halo.addColorStop(1, 'rgb(255 230 180 / 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(cx - 120, y - 60, 240, h + 120);
    }

    // Glass halves: the sunset stays visible through them.
    ctx.save();
    arch(6);
    ctx.clip();
    const half = (w - 12) / 2;
    const slide = half * k;
    const glass = (left: boolean, on: boolean, tone: readonly [number, number, number]) => {
      const gx = left ? x + 6 - slide : x + 6 + half + slide;
      const rgb = tone.join(' ');
      ctx.fillStyle = on ? `rgb(${rgb} / 0.22)` : 'rgb(14 26 44 / 0.42)';
      ctx.fillRect(gx, y, half, h);
      // Signal lines climbing the glass.
      ctx.fillStyle = on ? `rgb(${rgb} / 0.85)` : 'rgb(244 236 218 / 0.18)';
      for (let ly = y + h - 8; ly > y + 10; ly -= 7) ctx.fillRect(gx + 6, ly, half - 12, 1);
      // Inner edge light where the halves meet.
      ctx.fillStyle = on ? `rgb(${rgb})` : 'rgb(244 236 218 / 0.35)';
      ctx.fillRect(left ? gx + half - 2 : gx, y, 2, h);
      // Player tag on each half.
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = on ? `rgb(${rgb})` : 'rgb(244 236 218 / 0.6)';
      ctx.fillText(left ? 'P1' : 'P2', gx + half / 2, y + h - 12);
    };
    glass(true, p1On, P1_TONE);
    glass(false, p2On, P2_TONE);
    ctx.restore();

    // Frame: dark stone-navy band, cream inner line, gold keystones.
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0b1626';
    arch(2.5);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = k > 0 ? C.gold : '#f4ecda';
    arch(5);
    ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.fillRect(cx - 4, y - 3, 8, 6);
    ctx.fillRect(x - 3, y + h - 5, 8, 6);
    ctx.fillRect(x + w - 5, y + h - 5, 8, 6);
    // Threshold on the ground.
    ctx.fillStyle = k > 0 ? C.gold : 'rgb(244 236 218 / 0.75)';
    ctx.fillRect(x - 10, y + h, w + 20, 2);
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

      const p1On = s.stage !== 'await1';
      const p2On = s.stage === 'p2ready' || s.stage === 'opening' || s.stage === 'open';
      link(SWITCH_1, PORTAL.x + PORTAL.w / 4, p1On);
      link(SWITCH_2, PORTAL.x + (PORTAL.w * 3) / 4, p2On);
      portal(s, reduced);
      pad(SWITCH_1, p1On, reduced, s.t, P1_TONE);
      pad(SWITCH_2, p2On, reduced, s.t, P2_TONE);

      // Depth: whoever is lower on screen is drawn last.
      const actors = [
        { y: s.p1.y, draw: () => luis(s, walked) },
        { y: s.p2.y, draw: () => manu(s) },
      ].sort((a, b) => a.y - b.y);
      actors.forEach((a) => a.draw());
      padLabel(SWITCH_1, p1On, 'P1');
      padLabel(SWITCH_2, p2On, 'P2');
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
    // World: the sunset seafront, top-aligned so sky, bay and Cimavilla sit
    // above the horizon line of the play area.
    if (seafront) {
      const k = GATE_ARENA.w / seafront.width;
      g.imageSmoothingEnabled = true;
      g.drawImage(seafront, 0, -8, seafront.width * k, seafront.height * k);
      g.imageSmoothingEnabled = false;
    } else {
      g.fillStyle = C.bg;
      g.fillRect(0, 0, GATE_ARENA.w, GATE_ARENA.h);
    }
    // Ground plane: from the horizon down, the photo's blurred foreground
    // fades into night-blue glass so the players stand on a floor.
    const top = FLOOR.y - 14;
    const ground = g.createLinearGradient(0, top - 16, 0, GATE_ARENA.h);
    // Opaque from just under the horizon: nothing of the promenade photo
    // (bollards, bike) floats under the players.
    ground.addColorStop(0, 'rgb(12 22 40 / 0)');
    ground.addColorStop(0.08, 'rgb(14 26 46 / 0.92)');
    ground.addColorStop(0.16, 'rgb(13 24 42 / 1)');
    ground.addColorStop(1, 'rgb(8 14 28 / 1)');
    g.fillStyle = ground;
    g.fillRect(0, top - 16, GATE_ARENA.w, GATE_ARENA.h - top + 16);
    // Warm spill of the sunset on the floor, under the portal.
    const spill = g.createRadialGradient(320, top + 10, 0, 320, top + 10, 260);
    spill.addColorStop(0, 'rgb(255 170 110 / 0.22)');
    spill.addColorStop(1, 'rgb(255 170 110 / 0)');
    g.fillStyle = spill;
    g.fillRect(0, top, GATE_ARENA.w, GATE_ARENA.h - top);
    // Perspective grid: reads as ground, not as a dev panel.
    g.save();
    g.beginPath();
    g.rect(0, top, GATE_ARENA.w, GATE_ARENA.h - top);
    g.clip();
    g.strokeStyle = 'rgb(191 238 242 / 0.1)';
    g.lineWidth = 1;
    g.beginPath();
    const vx = 320;
    const vy = top - 60;
    for (let i = -10; i <= 10; i++) {
      const bx = vx + i * 70;
      g.moveTo(vx + (bx - vx) * ((top - vy) / (GATE_ARENA.h - vy)), top);
      g.lineTo(bx, GATE_ARENA.h);
    }
    for (let d = 1; d < 9; d++) {
      const y = top + (GATE_ARENA.h - top) * ((d * d) / 81);
      g.moveTo(0, Math.round(y) + 0.5);
      g.lineTo(GATE_ARENA.w, Math.round(y) + 0.5);
    }
    g.stroke();
    g.restore();
    // Horizon edge of the play area.
    g.fillStyle = 'rgb(191 238 242 / 0.4)';
    g.fillRect(0, top, GATE_ARENA.w, 1);
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
