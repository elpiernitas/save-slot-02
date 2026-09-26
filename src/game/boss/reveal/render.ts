/**
 * Cooperative gate room: system floor, two switches, one door. PLAYER 1 is
 * CHAR-001; PLAYER 2 has no approved sprite yet (CHAR-003 pending), so he is
 * shown as a labelled system marker — never a stand-in character.
 */
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
  let scale = 0;

  const resize = (displayHeightPx: number) => {
    const next = Math.max(1, Math.ceil(displayHeightPx / GATE_ARENA.h));
    if (next === scale) return;
    scale = next;
    canvas.width = GATE_ARENA.w * scale;
    canvas.height = GATE_ARENA.h * scale;
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
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, GATE_ARENA.w, GATE_ARENA.h);
      ctx.fillStyle = C.field;
      ctx.fillRect(FLOOR.x - 20, FLOOR.y - 10, FLOOR.w + 40, FLOOR.h + 30);
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += 40) {
        ctx.moveTo(x + 0.5, FLOOR.y - 10);
        ctx.lineTo(x + 0.5, FLOOR.y + FLOOR.h + 20);
      }
      ctx.stroke();
      ctx.strokeStyle = C.edge;
      ctx.strokeRect(FLOOR.x - 19.5, FLOOR.y - 9.5, FLOOR.w + 39, FLOOR.h + 29);

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
        { y: s.p2.y, draw: () => marker(s) },
      ].sort((a, b) => a.y - b.y);
      actors.forEach((a) => a.draw());
    },
  };

  function luis(s: GateState, walked: number) {
    const info = SPRITES.player;
    const img = images?.get('player');
    const { x, y, facing } = s.p1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(Math.round(x) - 7, Math.round(y) - 2, 14, 3);
    if (!img || !info) return;
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

  /** PLAYER 2 slot marker: a ground ring and a text tag (no figure). */
  function marker(s: GateState) {
    const x = Math.round(s.p2.x);
    const y = Math.round(s.p2.y);
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y - 40);
    ctx.stroke();
    ctx.fillStyle = C.cyan;
    ctx.fillRect(x - 17, y - 54, 34, 12);
    ctx.fillStyle = C.bg;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MANU', x, y - 45);
  }
}
