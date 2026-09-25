import type { PixelArt } from '../../content/sigils';
import { ANIMATED_ART, PROP_ART } from '../art/props';
import {
  buildCharacter,
  CHARACTER_FEET_Y,
  CHARACTER_W,
  characterFrameKey,
  PLAYER_STYLE,
  WAITRESS_STYLE,
} from '../art/characters';
import { hash2 } from '../art/pixelGrid';
import type { WorldSnapshot } from '../engine/WorldEngine';
import { TILE_SIZE as T, type WorldMap } from '../types';

/**
 * Canvas 2D renderer for exploration maps. Draws at the logical world
 * resolution into a backing store scaled by an integer factor
 * (nearest-neighbour), which CSS then fits to the 16:9 stage.
 *
 * Static ground (tiles, wall, gate, façade, street, baked shadows) is
 * pre-rendered once; props, NPCs and the player are y-sorted every frame.
 */
export interface WorldRenderer {
  /** Adapts the backing store to the displayed canvas height (device px). */
  resize(displayHeightPx: number): void;
  draw(snapshot: WorldSnapshot): void;
  destroy(): void;
}

const PLAYER_FRAMES = buildCharacter(PLAYER_STYLE);
const WAITRESS_FRAMES = buildCharacter(WAITRESS_STYLE);

function artToCanvas(art: PixelArt): HTMLCanvasElement {
  const w = Math.max(...art.rows.map((r) => r.length));
  const h = art.rows.length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  art.rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      const color = art.palette[c];
      if (c === '.' || !color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return canvas;
}

export function createWorldRenderer(
  canvas: HTMLCanvasElement,
  map: WorldMap,
  view: { w: number; h: number },
  options: { reducedMotion: () => boolean },
): WorldRenderer {
  const ctx = canvas.getContext('2d')!;
  const cache = new Map<PixelArt, HTMLCanvasElement>();
  const sprite = (art: PixelArt) => {
    let c = cache.get(art);
    if (!c) cache.set(art, (c = artToCanvas(art)));
    return c;
  };
  const ground = paintGround(map);
  let scale = 1;

  const resize = (displayHeightPx: number) => {
    scale = Math.max(1, Math.ceil(displayHeightPx / view.h));
    canvas.width = view.w * scale;
    canvas.height = view.h * scale;
    ctx.imageSmoothingEnabled = false;
  };
  resize(view.h);

  const draw = (snap: WorldSnapshot) => {
    const { camera: cam } = snap;
    const still = options.reducedMotion();
    const beat = (periodMs: number) =>
      (still ? 0 : Math.floor(snap.timeMs / periodMs) % 2) as 0 | 1;

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1b1a22';
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.drawImage(ground, cam.x, cam.y, view.w, view.h, 0, 0, view.w, view.h);
    ctx.translate(-cam.x, -cam.y);

    type Drawable = { baseY: number; draw: () => void };
    const list: Drawable[] = [];

    for (const prop of map.props) {
      const art = prop.sprite === 'tree' ? ANIMATED_ART.tree![beat(1700)] : PROP_ART[prop.sprite];
      if (!art) continue;
      const img = sprite(art);
      list.push({
        baseY: prop.baseY ?? prop.y + img.height,
        draw: () => ctx.drawImage(img, prop.x, prop.y),
      });
    }

    const character = (frames: Record<string, PixelArt>, x: number, y: number, key: string) => {
      const img = sprite(frames[key]!);
      list.push({
        baseY: y,
        draw: () => {
          ctx.fillStyle = 'rgba(20, 16, 32, 0.28)';
          ctx.fillRect(Math.round(x) - 5, Math.round(y) - 1, 10, 2);
          ctx.fillRect(Math.round(x) - 4, Math.round(y) - 2, 8, 4);
          ctx.drawImage(img, Math.round(x) - CHARACTER_W / 2, Math.round(y) - CHARACTER_FEET_Y);
        },
      });
    };
    for (const npc of map.npcs) {
      const frames = npc.sprite === 'waitress' ? WAITRESS_FRAMES : PLAYER_FRAMES;
      character(frames, npc.x, npc.y, characterFrameKey(npc.facing, 0));
    }
    character(
      PLAYER_FRAMES,
      snap.pos.x,
      snap.pos.y,
      characterFrameKey(snap.facing, snap.walkFrame),
    );

    list.sort((a, b) => a.baseY - b.baseY);
    for (const d of list) d.draw();

    // Seagulls on the wall top (ambient).
    const gull = sprite(ANIMATED_ART.seagull![beat(1300)]);
    ctx.drawImage(gull, 5 * T, 2);
    ctx.drawImage(sprite(ANIMATED_ART.seagull![beat(1900) === 1 ? 0 : 1]), 27 * T + 6, 4);

    drawStringLights(ctx, beat(900));

    // Warm afternoon light over everything (functional lighting, not decoration).
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = 'rgba(255, 170, 90, 0.07)';
    ctx.fillRect(0, 0, view.w, view.h);
  };

  return { resize, draw, destroy: () => cache.clear() };
}

// ---------------------------------------------------------------------------
// Static ground layer
// ---------------------------------------------------------------------------

function paintGround(map: WorldMap): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = map.widthTiles * T;
  canvas.height = map.heightTiles * T;
  const ctx = canvas.getContext('2d')!;
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const tileAt = (tx: number, ty: number) => map.tiles[ty]?.[tx] ?? ' ';

  for (let ty = 0; ty < map.heightTiles; ty++) {
    for (let tx = 0; tx < map.widthTiles; tx++) {
      const x = tx * T;
      const y = ty * T;
      switch (tileAt(tx, ty)) {
        case '.':
          cobbles(px, x, y, tx, ty);
          break;
        case ',':
          slabs(px, x, y, tx, ty);
          break;
        case '"':
          grass(px, x, y, tx, ty);
          break;
        case '_':
          px(x, y, T, T, '#a79d90');
          px(x, y, T, 3, '#cdc4b6');
          px(x, y + 13, T, 3, '#6b635b');
          break;
        case '=':
        case 'z':
          road(px, x, y, tx, ty, tileAt(tx, ty) === 'z');
          break;
        default:
          px(x, y, T, T, '#8d8176');
      }
    }
  }
  wall(px, map);
  gate(px);
  facade(px);
  bakedShadows(ctx);
  return canvas;
}

type Px = (x: number, y: number, w: number, h: number, color: string) => void;

/** Rounded setts with soft joints (irregular per row, low contrast). */
function cobbles(px: Px, x: number, y: number, tx: number, ty: number) {
  px(x, y, T, T, '#85796d');
  const colors = ['#a09486', '#a79b8c', '#9a8e81', '#ab9f90', '#978b7e'];
  for (let r = 0; r < 4; r++) {
    const gy = ty * 4 + r;
    let cx = -Math.floor(hash2(gy, 0, 21) * 5);
    let i = 0;
    while (cx < T) {
      const w = 4 + Math.floor(hash2(tx * 8 + i, gy, 1) * 3);
      const c = colors[Math.floor(hash2(tx * 8 + i, gy, 2) * colors.length)]!;
      const sy = y + r * 4;
      for (let dx = 0; dx < w - 1; dx++) {
        const cxp = cx + dx;
        if (cxp < 0 || cxp >= T) continue;
        const edge = dx === 0 || dx === w - 2;
        // Rounded corners: edge columns are one pixel shorter at the top.
        px(x + cxp, sy + (edge ? 1 : 0), 1, edge ? 2 : 3, c);
        if (!edge && dx === 1) px(x + cxp, sy, 1, 1, '#b9ad9d');
      }
      cx += w;
      i++;
    }
  }
}

function slabs(px: Px, x: number, y: number, tx: number, ty: number) {
  px(x, y, T, T, '#7d7266');
  const colors = ['#b3a693', '#a99c89', '#bcae9a', '#ad9f8b'];
  for (const [ox, oy] of [
    [0, 0],
    [8, 0],
    [0, 8],
    [8, 8],
  ] as const) {
    const c = colors[Math.floor(hash2(tx * 2 + ox, ty * 2 + oy, 4) * colors.length)]!;
    px(x + ox, y + oy, 7, 7, c);
    px(x + ox, y + oy, 7, 1, '#c9bca8');
  }
}

function grass(px: Px, x: number, y: number, tx: number, ty: number) {
  px(x, y, T, T, '#4f8a5e');
  for (let i = 0; i < 28; i++) {
    const gx = Math.floor(hash2(tx, i, 5) * T);
    const gy = Math.floor(hash2(ty, i, 6) * T);
    px(x + gx, y + gy, 1, 1, hash2(tx + i, ty, 7) < 0.5 ? '#6aa46f' : '#3f7350');
  }
  px(x, y + T - 2, T, 2, '#3a6b48');
}

function road(px: Px, x: number, y: number, tx: number, ty: number, zebra: boolean) {
  px(x, y, T, T, '#4b4e54');
  for (let i = 0; i < 10; i++) {
    px(
      x + Math.floor(hash2(tx, i, 8) * T),
      y + Math.floor(hash2(ty, i, 9) * T),
      1,
      1,
      i % 2 ? '#56595f' : '#42454a',
    );
  }
  if (zebra) px(x + 3, y, 10, T, '#e4e0d4');
  else if (ty === 27 && tx % 3 !== 0) px(x, y + 7, T, 2, '#d8d4c8');
}

function wall(px: Px, map: WorldMap) {
  const colors = ['#a29684', '#958977', '#b1a590', '#8a7f6f', '#9d917e'];
  const wallRight = 35 * T;
  // Crenellated top (row 0)
  px(0, 0, wallRight, T, '#6f665b');
  for (let x = 0; x < wallRight; x += 24) {
    px(x, 2, 14, 14, '#9b8f7e');
    px(x, 2, 14, 2, '#b8ab97');
    px(x + 12, 4, 2, 12, '#7d7264');
  }
  // Courses of irregular blocks (rows 1–5)
  for (let course = 0; course < 10; course++) {
    const y = T + course * 8;
    px(0, y, wallRight, 8, '#5f564c');
    let x = -((course % 2) * 7);
    let i = 0;
    while (x < wallRight) {
      const w = 10 + Math.floor(hash2(course, i, 12) * 8);
      const c = colors[Math.floor(hash2(course, i, 13) * colors.length)]!;
      const sx = Math.max(x, 0);
      const sw = Math.min(x + w - 1, wallRight) - sx;
      if (sw > 0) {
        px(sx, y, sw, 7, c);
        px(sx, y, sw, 1, '#c1b49f');
        px(sx + sw - 1, y + 1, 1, 6, '#7a6f60');
      }
      x += w;
      i++;
    }
  }
  // Moss and a dark base line where the wall meets the ground.
  for (let i = 0; i < 70; i++) {
    const mx = Math.floor(hash2(i, 1, 14) * wallRight);
    px(mx, 6 * T - 2 - Math.floor(hash2(i, 2, 15) * 10), 2, 1, '#5f8a4f');
  }
  px(0, 6 * T - 2, wallRight, 2, '#4f473e');
  void map;
}

function gate(px: Px) {
  const x = 22 * T;
  const y = 3 * T;
  // Arch of lighter stones
  px(x - 4, y - 10, 72, 58, '#b9ac97');
  px(x - 2, y - 8, 68, 56, '#8a7f6f');
  px(x + 4, y - 4, 56, 4, '#b9ac97');
  // Double wooden door
  px(x + 2, y, 60, 48, '#3b2a20');
  for (let i = 0; i < 12; i++) px(x + 4 + i * 5, y + 2, 4, 44, i % 2 ? '#5b3f2c' : '#4f3627');
  px(x + 31, y + 2, 2, 46, '#2a1d16');
  for (const sy of [8, 22, 36])
    for (let i = 0; i < 6; i++) px(x + 7 + i * 10, y + sy, 2, 2, '#2b2b2f');
  px(x + 27, y + 24, 3, 3, '#c9a24a');
  px(x + 34, y + 24, 3, 3, '#c9a24a');
}

function facade(px: Px) {
  const x0 = 35 * T;
  const w = 13 * T;
  // Cream plaster, cornice, floors
  px(x0, 0, w, 13 * T, '#efe3c8');
  for (let i = 0; i < 90; i++) {
    px(x0 + Math.floor(hash2(i, 3, 16) * w), Math.floor(hash2(i, 4, 17) * 130), 2, 1, '#e3d5b6');
  }
  px(x0, 0, w, 4, '#8e4a3c');
  px(x0, 4, w, 2, '#6f3a30');
  px(x0, 62, w, 3, '#d8c9a8');
  px(x0, 0, 3, 13 * T, '#d9caa9');
  // Upper windows with afternoon glare, balconies
  for (const wy of [14, 76]) {
    for (let i = 0; i < 5; i++) {
      const wx = x0 + 12 + i * 40;
      px(wx - 2, wy - 2, 24, 36, '#5a4a3f');
      px(wx, wy, 20, 32, '#8fb3cf');
      px(wx, wy, 20, 10, '#cfe1ec');
      px(wx + 9, wy, 2, 32, '#5a4a3f');
      if (hash2(i, wy, 18) < 0.45) px(wx, wy + 12, 20, 20, '#f6c865');
      px(wx - 4, wy + 34, 28, 2, '#3c3a3f');
      for (let b = 0; b < 7; b++) px(wx - 4 + b * 4, wy + 28, 1, 6, '#3c3a3f');
    }
  }
  // Café sign board with a pixel cup (no real signage)
  px(x0 + 70, 124, 68, 14, '#2f5d4a');
  px(x0 + 72, 126, 64, 10, '#3f7a60');
  px(x0 + 98, 128, 10, 6, '#f1e6cf');
  px(x0 + 108, 129, 2, 3, '#f1e6cf');
  px(x0 + 99, 134, 8, 1, '#f1e6cf');
  // Awning (coral/cream) with scalloped edge
  for (let i = 0; i < w; i++) {
    const stripe = Math.floor(i / 8) % 2 === 0 ? '#e8735a' : '#f1e6cf';
    px(x0 + i, 140, 1, 12, stripe);
    if (i % 8 < 5) px(x0 + i, 152, 1, 3, stripe);
  }
  px(x0, 140, w, 1, '#b85442');
  // Ground floor: warm interior, wooden frames, door
  px(x0, 156, w, 52, '#3f2b22');
  for (const wx of [x0 + 6, x0 + 62, x0 + 150]) {
    px(wx, 160, 48, 40, '#f2c14e');
    px(wx, 160, 48, 6, '#ffe29a');
    for (let s = 0; s < 3; s++) px(wx + 6 + s * 14, 186, 6, 14, '#b07a3a');
    px(wx + 23, 160, 2, 40, '#3f2b22');
  }
  px(x0 + 118, 162, 24, 46, '#2c1f19');
  px(x0 + 120, 164, 20, 18, '#f2c14e');
  px(x0 + 136, 188, 2, 4, '#c9a24a');
  px(x0, 206, w, 2, '#2a1d16');
}

function bakedShadows(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(24, 20, 44, 0.22)';
  // Tree canopy shadow, cast east (sun low in the west).
  ctx.beginPath();
  ctx.ellipse(10 * T + 40, 14 * T + 14, 46, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Parasol shadows over the terrace.
  for (const [x, y] of [
    [34 * T + 26, 15 * T + 14],
    [39 * T + 26, 15 * T + 14],
    [44 * T + 24, 15 * T + 14],
    [36 * T + 30, 19 * T + 10],
    [42 * T + 26, 19 * T + 10],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, 17, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Wall shadow on the planting strip.
  ctx.fillRect(0, 6 * T, 35 * T, 4);
}

function drawStringLights(ctx: CanvasRenderingContext2D, beat: 0 | 1) {
  const x0 = 33 * T;
  const x1 = 48 * T;
  const bulbs = ['#ffd27a', '#fff1b8'];
  for (let x = x0; x < x1; x += 2) {
    const t = ((x - x0) % 64) / 64;
    const y = 12 * T + 2 + Math.round(Math.sin(t * Math.PI) * 10);
    ctx.fillStyle = '#2b2528';
    ctx.fillRect(x, y, 2, 1);
    if ((x - x0) % 12 === 0) {
      ctx.fillStyle = bulbs[((x - x0) / 12 + beat) % 2]!;
      ctx.fillRect(x, y + 1, 2, 2);
    }
  }
}
