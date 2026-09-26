/**
 * DESYNC PROCESS arena drawing. System geometry only (no creature, no face):
 * a navy field, a thin stable grid, the three nodes, the core and PLAYER 1
 * (CHAR-001). The renderer reads state; it never changes it.
 *
 * Telegraphs are outlines + chevrons (shape and position, not colour only);
 * active danger is a filled coral shape with a solid edge.
 */
import { CHARACTER_ROWS, SPRITES, type SpriteImages } from '../../world/art/assets';
import {
  ARENA,
  COMMITS_PER_NODE,
  CORE,
  currentHazard,
  NODES,
  PHASE_NODES,
  REACH,
  SAFE,
  timing,
  type DesyncState,
  type HazardView,
  type NodeId,
  type Rect,
} from './state';

const C = {
  bg: '#0b1626',
  field: '#0e1a2c',
  grid: '#16243d',
  edge: '#3c5a82',
  cyan: '#bfeef2',
  cream: '#f4ecda',
  dim: '#5d7392',
  coral: '#e8735a',
  gold: '#f2c14e',
};

/** Walked distance (px) per step frame. */
const STEP_PX = 10;

export function createDesyncRenderer(canvas: HTMLCanvasElement, images: SpriteImages | null) {
  const ctx = canvas.getContext('2d')!;
  let scale = 1;

  const resize = (displayHeightPx: number) => {
    const next = Math.max(1, Math.ceil(displayHeightPx / ARENA.h));
    if (next === scale && canvas.width === ARENA.w * next) return;
    scale = next;
    canvas.width = ARENA.w * scale;
    canvas.height = ARENA.h * scale;
  };
  resize(ARENA.h);

  const chevron = (x: number, y: number, dir: 'right' | 'left' | 'down') => {
    ctx.beginPath();
    if (dir === 'down') {
      ctx.moveTo(x - 6, y - 3);
      ctx.lineTo(x, y + 3);
      ctx.lineTo(x + 6, y - 3);
    } else {
      const s = dir === 'right' ? 1 : -1;
      ctx.moveTo(x - 3 * s, y - 6);
      ctx.lineTo(x + 3 * s, y);
      ctx.lineTo(x - 3 * s, y + 6);
    }
    ctx.stroke();
  };

  const rectPath = (r: Rect) => {
    ctx.beginPath();
    ctx.rect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  };

  const hazard = (view: HazardView, s: DesyncState, reduced: boolean) => {
    const t = timing(s.assist);
    const local = s.t - s.stepStart;
    ctx.lineWidth = 1;
    if (view.stage === 'recovery') {
      ctx.globalAlpha = 0.35;
    }
    if (view.ring) {
      const { inner, outer } = view.ring;
      // Clipped to the field: the ring only matters where PLAYER 1 can be.
      ctx.save();
      ctx.beginPath();
      ctx.rect(SAFE.x, SAFE.y, SAFE.w, SAFE.h);
      ctx.clip();
      if (view.stage === 'active') {
        ctx.beginPath();
        ctx.arc(CORE.x, CORE.y, outer, 0, Math.PI * 2);
        if (inner > 0) {
          ctx.moveTo(CORE.x + inner, CORE.y);
          ctx.arc(CORE.x, CORE.y, inner, 0, Math.PI * 2, true);
        }
        ctx.fillStyle = 'rgba(232,115,90,0.5)';
        ctx.fill('evenodd');
      }
      ctx.strokeStyle = view.stage === 'telegraph' ? C.cream : C.coral;
      ctx.setLineDash(view.stage === 'telegraph' ? [4, 4] : []);
      for (const r of inner > 0 ? [inner, outer] : [outer]) {
        ctx.beginPath();
        ctx.arc(CORE.x, CORE.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    for (const r of view.rects) {
      if (view.stage === 'active') {
        ctx.fillStyle = 'rgba(232,115,90,0.5)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = C.coral;
        rectPath(r);
        ctx.stroke();
      } else {
        ctx.strokeStyle = view.stage === 'telegraph' ? C.cream : C.dim;
        ctx.setLineDash([4, 4]);
        rectPath(r);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    // Sweep direction: chevrons along the lane while it is announced.
    if (view.hazard.kind === 'sweep' && view.stage === 'telegraph') {
      const lane = view.hazard.lane;
      const dir = view.hazard.dir;
      ctx.strokeStyle = C.cream;
      const shift = reduced ? 0 : Math.floor((local / t.telegraph) * 12);
      if (dir === 'down') {
        for (let y = lane.y + 12 + shift; y < lane.y + lane.h - 6; y += 24) {
          chevron(lane.x + lane.w / 2 - 60, y, 'down');
          chevron(lane.x + lane.w / 2 + 60, y, 'down');
        }
      } else {
        const s = dir === 'right' ? 1 : -1;
        for (let x = lane.x + 12; x < lane.x + lane.w - 6; x += 24) {
          for (let y = lane.y + 30; y < lane.y + lane.h; y += 60) chevron(x + shift * s, y, dir);
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  const node = (id: NodeId, s: DesyncState) => {
    const { x, y } = NODES[id];
    const live = PHASE_NODES[s.phase].includes(id) && !s.banner;
    const done = s.nodes[id] >= COMMITS_PER_NODE;
    ctx.lineWidth = 1;
    ctx.strokeStyle = done ? C.cyan : live ? C.cream : C.dim;
    ctx.fillStyle = done ? C.cyan : C.field;
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x, y + 12);
    ctx.lineTo(x - 12, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (live && !done) {
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(x, y, REACH, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Progress pips (text-free, and the HUD also writes it).
    for (let i = 0; i < COMMITS_PER_NODE; i++) {
      ctx.fillStyle = i < s.nodes[id] ? C.cyan : C.grid;
      ctx.fillRect(x - 10 + i * 8, y + 18, 5, 3);
    }
    ctx.fillStyle = done ? C.cyan : live ? C.cream : C.dim;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(id.toUpperCase(), x, y - 18);
  };

  const core = (s: DesyncState, reduced: boolean) => {
    const on = s.coreActive;
    const r = on && !reduced ? 9 + (Math.floor(s.t / 250) % 2) : 9;
    ctx.lineWidth = 1;
    ctx.strokeStyle = on ? C.gold : s.phase === 'missing' ? C.cream : C.dim;
    ctx.fillStyle = on ? C.gold : C.field;
    ctx.beginPath();
    ctx.rect(CORE.x - r, CORE.y - r, r * 2, r * 2);
    ctx.fill();
    ctx.stroke();
    if (on) {
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(CORE.x, CORE.y, REACH, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const player = (s: DesyncState, walked: number, reduced: boolean) => {
    const info = SPRITES.player;
    const img = images?.get('player');
    const hurt = s.t < s.invulnerableUntil;
    if (hurt && !reduced && Math.floor(s.t / 100) % 2 === 0) return;
    const { x, y, facing } = s.player;
    ctx.globalAlpha = hurt && reduced ? 0.55 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(Math.round(x) - 7, Math.round(y) - 2, 14, 3);
    if (img && info) {
      const frame = walked > 0 ? (Math.floor(walked / STEP_PX) % 2) + 1 : 0;
      ctx.drawImage(
        img,
        frame * info.frameWidth,
        CHARACTER_ROWS[facing] * info.frameHeight,
        info.frameWidth,
        info.frameHeight,
        Math.round(x) - info.anchorX,
        Math.round(y) - info.anchorY,
        info.frameWidth,
        info.frameHeight,
      );
    }
    ctx.globalAlpha = 1;
  };

  return {
    resize,
    draw(s: DesyncState, walked: number, reduced: boolean) {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      // The page's letter-spacing would otherwise leak into canvas text.
      ctx.letterSpacing = '0px';
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, ARENA.w, ARENA.h);
      ctx.fillStyle = C.field;
      ctx.fillRect(SAFE.x, SAFE.y, SAFE.w, SAFE.h);
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = SAFE.x + 32; x < SAFE.x + SAFE.w; x += 32) {
        ctx.moveTo(x + 0.5, SAFE.y);
        ctx.lineTo(x + 0.5, SAFE.y + SAFE.h);
      }
      for (let y = SAFE.y + 32; y < SAFE.y + SAFE.h; y += 32) {
        ctx.moveTo(SAFE.x, y + 0.5);
        ctx.lineTo(SAFE.x + SAFE.w, y + 0.5);
      }
      ctx.stroke();
      ctx.strokeStyle = C.edge;
      rectPath(SAFE);
      ctx.stroke();

      const view = currentHazard(s);
      // Danger under the actors; the ring is drawn the same way.
      if (view) hazard(view, s, reduced);
      core(s, reduced);
      (Object.keys(NODES) as NodeId[]).forEach((id) => node(id, s));
      player(s, walked, reduced);
    },
  };
}
