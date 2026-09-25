import type { PixelArt } from '../../content/sigils';
import { hash2, PixelGrid } from './pixelGrid';

/**
 * Original environment props for the afternoon slice. Built as pixel data;
 * light comes from the west (left), so right sides are shaded.
 */

function bollard(marked: boolean): PixelArt {
  const g = new PixelGrid(6, 14);
  g.rect(1, 1, 4, 12, 'g').rect(1, 1, 4, 1, 'G').rect(4, 2, 1, 11, 'd');
  g.rect(1, 4, 4, 1, marked ? 'r' : 'G');
  if (marked) g.rect(1, 6, 4, 1, 'r');
  g.outline('o');
  return g.toArt({ g: '#747b83', G: '#aab2b9', d: '#50565d', r: '#e8735a', o: '#26232a' });
}

function tableSet(): PixelArt {
  const g = new PixelGrid(24, 14);
  // Chairs (left/right), wooden
  for (const cx of [1, 19])
    g.rect(cx, 3, 4, 3, 'C')
      .rect(cx, 6, 4, 1, 'c')
      .rect(cx, 7, 1, 4, 'c')
      .rect(cx + 3, 7, 1, 4, 'c');
  // Round metal table
  g.rect(8, 2, 8, 1, 't')
    .rect(7, 3, 10, 3, 'T')
    .rect(7, 6, 10, 1, 't')
    .rect(11, 7, 2, 5, 'l')
    .rect(9, 12, 6, 1, 'l');
  g.rect(9, 3, 2, 1, 'W'); // glint
  g.outline('o');
  return g.toArt({
    C: '#9a6d4b',
    c: '#6b4a36',
    t: '#9aa2a9',
    T: '#dfe3e5',
    W: '#ffffff',
    l: '#4a4f55',
    o: '#2a2225',
  });
}

function parasol(): PixelArt {
  const g = new PixelGrid(32, 40);
  for (let r = 0; r < 9; r++) {
    const half = Math.min(15, 4 + r * 1.5);
    for (let x = Math.round(16 - half); x < Math.round(16 + half); x++) {
      const stripe = Math.floor((x - 16 + 32) / 4) % 2 === 0;
      g.set(x, r + 1, r === 8 ? 'D' : stripe ? 'a' : 'b');
    }
  }
  g.rect(15, 10, 2, 28, 'p');
  g.outline('o');
  return g.toArt({ a: '#f1e6cf', b: '#e8735a', D: '#b85442', p: '#5a5f66', o: '#2a2225' });
}

function lamp(): PixelArt {
  const g = new PixelGrid(8, 44);
  g.rect(1, 1, 6, 1, 'k').rect(2, 2, 4, 5, 'y').rect(2, 2, 1, 5, 'Y').rect(1, 7, 6, 1, 'k');
  g.rect(3, 8, 2, 34, 'k').rect(2, 42, 4, 1, 'k');
  g.outline('o');
  return g.toArt({ k: '#2f3338', y: '#f2c14e', Y: '#fff1b8', o: '#16141a' });
}

function sign(): PixelArt {
  const g = new PixelGrid(22, 28);
  g.rect(1, 1, 20, 14, 'r').rect(2, 2, 18, 12, 'w');
  // Abstract lettering (no readable real signage) + a crossed-out seagull.
  for (const [y, len] of [
    [4, 14],
    [6, 11],
    [9, 12],
    [11, 8],
  ] as const)
    g.rect(4, y, len, 1, 'k');
  g.rect(15, 8, 3, 1, 'g').set(16, 7, 'g');
  g.rect(4, 15, 2, 12, 'p').rect(16, 15, 2, 12, 'p');
  g.outline('o');
  return g.toArt({
    r: '#e8735a',
    w: '#f4efe2',
    k: '#3b3a40',
    g: '#8a8f96',
    p: '#5a5f66',
    o: '#26232a',
  });
}

function planter(): PixelArt {
  const g = new PixelGrid(18, 14);
  for (let y = 0; y < 7; y++) {
    for (let x = 1; x < 17; x++) {
      const n = hash2(x, y, 7);
      if ((y === 0 && n < 0.5) || (y > 0 && y < 7))
        g.set(x, y, n < 0.3 ? 'L' : n < 0.75 ? 'm' : 'D');
    }
  }
  g.rect(1, 7, 16, 6, 's').rect(1, 7, 16, 1, 'S').rect(15, 8, 2, 5, 'd');
  g.outline('o');
  return g.toArt({
    L: '#7fbf7a',
    m: '#4f9d5e',
    D: '#35704a',
    s: '#a39686',
    S: '#c4b8a6',
    d: '#7d7266',
    o: '#2a2622',
  });
}

function bench(): PixelArt {
  const g = new PixelGrid(30, 14);
  g.rect(1, 1, 28, 2, 'w').rect(1, 4, 28, 2, 'w').rect(1, 3, 28, 1, 'd').rect(1, 6, 28, 1, 'd');
  g.rect(3, 7, 2, 6, 'm').rect(25, 7, 2, 6, 'm');
  g.outline('o');
  return g.toArt({ w: '#a8774f', d: '#7a5236', m: '#3c4046', o: '#241c1a' });
}

function seagull(frame: 0 | 1): PixelArt {
  const g = new PixelGrid(12, 9);
  g.rect(2, 3, 7, 3, 'w').rect(3, 2, 5, 1, 'w').rect(4, 3, 4, 1, 'g');
  if (frame === 0) g.rect(8, 1, 3, 2, 'w').set(10, 1, 'e').set(11, 2, 'y');
  else g.rect(8, 2, 3, 2, 'w').set(10, 2, 'e').set(11, 3, 'y');
  g.rect(4, 6, 1, 2, 'y').rect(6, 6, 1, 2, 'y').rect(1, 4, 1, 1, 'k');
  g.outline('o');
  return g.toArt({
    w: '#f4f4f0',
    g: '#aab2bb',
    e: '#111111',
    y: '#f2c14e',
    k: '#3b3f46',
    o: '#2c2f36',
  });
}

/** Big leafy tree: trunk + canopy of overlapping blobs, lit from the west. */
function tree(sway: 0 | 1): PixelArt {
  const g = new PixelGrid(72, 88);
  const blobs = [
    [36, 30, 26],
    [20, 38, 18],
    [52, 38, 18],
    [34, 16, 16],
    [26, 48, 14],
    [46, 48, 14],
  ] as const;
  for (let y = 0; y < 62; y++) {
    for (let x = 0; x < 72; x++) {
      let inside = false;
      let light = 0;
      for (const [cx, cy, r] of blobs) {
        const dx = x - (cx + sway);
        const dy = y - cy;
        const d = Math.hypot(dx, dy);
        if (d < r - hash2(x, y, 3) * 3) {
          inside = true;
          light = Math.max(light, (-dx - dy) / r); // lit from top-left
        }
      }
      if (!inside) continue;
      const n = hash2(x >> 1, y >> 1, 11);
      const v = light + n * 0.6;
      g.set(x, y, v > 0.95 ? 'H' : v > 0.55 ? 'L' : v > 0.1 ? 'm' : 'D');
    }
  }
  // Trunk and roots
  g.rect(31, 50, 8, 32, 't')
    .rect(36, 50, 3, 32, 'T')
    .rect(29, 80, 12, 3, 't')
    .rect(33, 56, 2, 8, 'b');
  g.outline('o');
  return g.toArt({
    H: '#b7dc8a',
    L: '#7fbf6a',
    m: '#4f9153',
    D: '#2f6242',
    t: '#7a5236',
    T: '#583a28',
    b: '#9a6d4b',
    o: '#1f2a22',
  });
}

export const PROP_ART: Readonly<Record<string, PixelArt>> = {
  bollard: bollard(false),
  bollardMarked: bollard(true),
  tableSet: tableSet(),
  parasol: parasol(),
  lamp: lamp(),
  sign: sign(),
  planter: planter(),
  bench: bench(),
  tree: tree(0),
};

/** Two-frame ambient animations (frozen with reduced motion). */
export const ANIMATED_ART: Readonly<Record<string, readonly [PixelArt, PixelArt]>> = {
  tree: [tree(0), tree(1)],
  seagull: [seagull(0), seagull(1)],
};
