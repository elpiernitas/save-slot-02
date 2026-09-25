// Map characters, 32×48, feet on row 45. Light from the west (left).
import { Canvas, darken, lighten, mix } from './canvas.mjs';

export const CHAR_W = 32;
export const CHAR_H = 48;
export const CHAR_FEET_Y = 45;

/** PROVISIONAL PLAYER 1: canon outfit only, no final likeness. */
export const PLAYER = {
  hair: '#231a1e',
  skin: '#e4b390',
  eye: '#1c1518',
  mouth: '#b9745d',
  top: '#f5f2ec',
  heart: '#141115',
  pants: '#3a4b6a',
  shoe: '#2a2a31',
  sole: '#d9d6d0',
  style: 'curtain',
  apron: null,
};

/** Generic, non-canon NPC. */
export const WAITRESS = {
  hair: '#7a3f29',
  skin: '#d9a17d',
  eye: '#1c1518',
  mouth: '#a7614c',
  top: '#2a2c34',
  heart: null,
  pants: '#23252c',
  shoe: '#18181d',
  sole: '#3a3a42',
  style: 'bun',
  apron: '#e6dac1',
};

function shade(c) {
  return darken(c, 0.22);
}
function deep(c) {
  return darken(c, 0.4);
}

function drawLegsFront(c, p, frame) {
  const liftL = frame === 2 ? 2 : 0;
  const liftR = frame === 1 ? 2 : 0;
  c.rect(10, 34, 13, 3, p.pants).rect(10, 34, 13, 1, deep(p.pants));
  // left leg (lit)
  c.rect(10, 37, 6, 6 - liftL, p.pants).rect(10, 37, 1, 6 - liftL, lighten(p.pants, 0.18));
  c.rect(10, 43 - liftL, 6, 2, p.shoe)
    .rect(9, 44 - liftL, 7, 1, p.shoe)
    .rect(9, 45 - liftL, 7, 1, p.sole);
  // right leg (shade side)
  c.rect(17, 37, 6, 6 - liftR, shade(p.pants)).rect(22, 37, 1, 6 - liftR, deep(p.pants));
  c.rect(17, 43 - liftR, 6, 2, p.shoe)
    .rect(17, 44 - liftR, 7, 1, p.shoe)
    .rect(17, 45 - liftR, 7, 1, p.sole);
  c.rect(16, 37, 1, 3, deep(p.pants));
}

function drawTorsoFront(c, p, frame, dy, back) {
  const top = p.top;
  // shoulders + body
  c.ellipse(16.5, 23 + dy, 8.5, 3, top);
  c.rect(9, 23 + dy, 15, 11, top);
  c.rect(20, 23 + dy, 4, 11, shade(top)).rect(23, 24 + dy, 1, 10, deep(top));
  c.rect(9, 33 + dy, 15, 1, shade(top));
  // arms (long sleeves) with a small swing
  const swingL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  const swingR = -swingL;
  c.rect(6, 22 + dy + swingL, 3, 11, top).rect(6, 22 + dy + swingL, 1, 11, lighten(top, 0.3));
  c.rect(6, 32 + dy + swingL, 3, 1, shade(top));
  c.rect(6, 33 + dy + swingL, 3, 2, p.skin);
  c.rect(24, 22 + dy + swingR, 3, 11, shade(top)).rect(26, 22 + dy + swingR, 1, 11, deep(top));
  c.rect(24, 33 + dy + swingR, 3, 2, shade(p.skin));
  // folds
  for (const [x, y] of [
    [12, 30],
    [13, 31],
    [19, 29],
    [18, 31],
  ])
    c.px(x, y + dy, shade(top));
  if (!back) {
    // collar
    c.rect(13, 21 + dy, 7, 1, shade(top));
    if (p.heart) {
      const heart = ['.XX.XX', 'XXXXXX', 'XXXXXX', '.XXXX.', '..XX..'];
      heart.forEach((row, j) =>
        [...row].forEach((ch, i) => ch === 'X' && c.px(13 + i, 25 + j + dy, p.heart)),
      );
    }
    if (p.apron) {
      c.rect(11, 28 + dy, 11, 9, p.apron).rect(19, 28 + dy, 3, 9, shade(p.apron));
      c.rect(11, 28 + dy, 11, 1, lighten(p.apron, 0.3));
      c.rect(14, 31 + dy, 4, 2, shade(p.apron)); // pocket
    }
  } else {
    c.rect(16, 24 + dy, 1, 9, shade(top));
    if (p.apron) c.rect(14, 29 + dy, 5, 1, p.apron);
  }
}

function drawHeadFront(c, p, dy) {
  // neck
  c.rect(14, 18 + dy, 5, 3, shade(p.skin));
  // face
  c.ellipse(16.5, 12.5 + dy, 5.8, 6.3, p.skin);
  c.rect(19, 9 + dy, 3, 9, shade(p.skin), 0.35);
  // ears
  c.rect(9, 12 + dy, 2, 3, shade(p.skin)).rect(22, 12 + dy, 2, 3, shade(p.skin));
  // eyes, brows, nose, mouth, blush
  c.rect(13, 12 + dy, 1, 2, p.eye).rect(19, 12 + dy, 1, 2, p.eye);
  c.px(12, 12 + dy, lighten(p.skin, 0.5)).px(20, 12 + dy, lighten(p.skin, 0.5));
  c.px(16, 15 + dy, shade(p.skin)).px(17, 15 + dy, shade(p.skin));
  c.rect(15, 17 + dy, 3, 1, p.mouth);
  c.px(12, 16 + dy, mix(p.skin, '#e07a6a', 0.35)).px(21, 16 + dy, mix(p.skin, '#e07a6a', 0.35));
  const hi = lighten(p.hair, 0.22);
  if (p.style === 'curtain') {
    // Hair cap
    for (let y = 2; y <= 9; y++) {
      for (let x = 8; x <= 25; x++) {
        const dx = (x + 0.5 - 16.5) / 8.6;
        const dy2 = (y + 0.5 - 9) / 7.2;
        if (dx * dx + dy2 * dy2 <= 1) c.px(x, y + dy, p.hair);
      }
    }
    // Centre part (lighter line) and curtains framing the forehead
    for (let y = 3; y <= 8; y++) c.px(16, y + dy, hi);
    c.px(17, 3 + dy, hi);
    const curtainL = [
      [10, 14],
      [10, 13],
      [10, 12],
      [9, 11],
      [9, 10],
      [9, 10],
      [9, 10],
    ];
    const curtainR = [
      [18, 23],
      [19, 23],
      [20, 23],
      [21, 24],
      [22, 24],
      [22, 24],
      [22, 24],
    ];
    curtainL.forEach(([a, b], j) => c.rect(a, 9 + j + dy, b - a + 1, 1, p.hair));
    curtainR.forEach(([a, b], j) => c.rect(a, 9 + j + dy, b - a + 1, 1, p.hair));
    // highlights (lit from the west)
    for (const [x, y] of [
      [11, 4],
      [12, 4],
      [10, 5],
      [13, 3],
      [11, 6],
    ])
      c.px(x, y + dy, hi);
    for (const [x, y] of [
      [21, 5],
      [22, 6],
      [23, 8],
    ])
      c.px(x, y + dy, darken(p.hair, 0.2));
    // brows under the fringe
    c.rect(12, 11 + dy, 2, 1, p.hair).rect(19, 11 + dy, 2, 1, p.hair);
  } else {
    // Pulled back hair with a bun
    c.ellipse(16.5, 3 + dy, 3.5, 3, p.hair)
      .px(15, 2 + dy, hi)
      .px(16, 1 + dy, hi);
    for (let y = 4; y <= 9; y++) {
      for (let x = 9; x <= 24; x++) {
        const dx = (x + 0.5 - 16.5) / 7.8;
        const dy2 = (y + 0.5 - 10) / 6;
        if (dx * dx + dy2 * dy2 <= 1) c.px(x, y + dy, p.hair);
      }
    }
    c.rect(9, 9 + dy, 2, 4, p.hair).rect(22, 9 + dy, 2, 4, p.hair);
    for (const [x, y] of [
      [12, 5],
      [13, 5],
      [11, 6],
    ])
      c.px(x, y + dy, hi);
    c.rect(12, 10 + dy, 2, 1, darken(p.hair, 0.1)).rect(19, 10 + dy, 2, 1, darken(p.hair, 0.1));
  }
}

function drawHeadBack(c, p, dy) {
  c.rect(14, 18 + dy, 5, 3, shade(p.skin));
  c.ellipse(16.5, 10.5 + dy, 8, 8.2, p.hair);
  c.rect(10, 12 + dy, 13, 6, p.hair);
  const hi = lighten(p.hair, 0.22);
  for (const [x, y] of [
    [11, 5],
    [12, 4],
    [10, 7],
    [13, 4],
  ])
    c.px(x, y + dy, hi);
  c.rect(20, 6 + dy, 3, 10, darken(p.hair, 0.2));
  if (p.style === 'bun') c.ellipse(16.5, 4 + dy, 3.8, 3.2, darken(p.hair, 0.1)).px(15, 3 + dy, hi);
  // ears peeking out
  c.rect(8, 12 + dy, 1, 2, shade(p.skin)).rect(24, 12 + dy, 1, 2, shade(p.skin));
}

function drawSide(c, p, frame) {
  const dy = frame === 0 ? 0 : 1;
  // legs
  const legs =
    frame === 0
      ? [[13, 19]]
      : frame === 1
        ? [
            [10, 15],
            [17, 22],
          ]
        : [
            [12, 17],
            [15, 20],
          ];
  c.rect(12, 34, 9, 3, p.pants);
  legs.forEach(([a, b], i) => {
    const color = i === 0 && legs.length > 1 ? shade(p.pants) : p.pants;
    c.rect(a, 37, b - a + 1, 6, color).rect(a, 37, 1, 6, lighten(color, 0.15));
    c.rect(a, 43, b - a + 3, 2, p.shoe).rect(a, 45, b - a + 3, 1, p.sole);
  });
  // body
  c.rect(11, 22 + dy, 11, 12, p.top).rect(11, 22 + dy, 2, 12, lighten(p.top, 0.25));
  c.rect(20, 23 + dy, 2, 11, shade(p.top));
  c.ellipse(16.5, 22.5 + dy, 5.5, 2.5, p.top);
  if (p.apron) c.rect(19, 28 + dy, 3, 9, p.apron).rect(21, 28 + dy, 1, 9, shade(p.apron));
  // arm (swings with the step)
  const ax = frame === 1 ? 17 : frame === 2 ? 12 : 14;
  c.rect(ax, 23 + dy, 4, 10, shade(p.top))
    .rect(ax, 32 + dy, 4, 1, deep(p.top))
    .rect(ax, 33 + dy, 4, 2, p.skin);
  // head: back hair mass, then face, then fringe
  const hi = lighten(p.hair, 0.22);
  c.rect(15, 18 + dy, 5, 3, shade(p.skin));
  c.ellipse(14.5, 10 + dy, 6.5, 7, p.hair);
  c.rect(9, 10 + dy, 5, 7, p.hair);
  c.ellipse(18.5, 12.5 + dy, 5, 5.8, p.skin);
  c.rect(23, 13 + dy, 1, 2, p.skin); // nose
  c.rect(21, 12 + dy, 1, 2, p.eye);
  c.rect(21, 17 + dy, 2, 1, p.mouth);
  c.px(20, 15 + dy, mix(p.skin, '#e07a6a', 0.35));
  c.rect(15, 12 + dy, 2, 3, shade(p.skin)); // ear
  c.px(15, 11 + dy, p.hair);
  if (p.style === 'curtain') {
    // fringe falling forward, parted in the middle
    c.rect(14, 4 + dy, 8, 5, p.hair)
      .rect(18, 9 + dy, 5, 1, p.hair)
      .rect(20, 10 + dy, 3, 1, p.hair);
    c.rect(21, 11 + dy, 1, 1, p.hair).rect(21, 11 + dy, 2, 1, p.hair);
    c.rect(20, 11 + dy, 2, 1, p.hair); // brow line under the fringe
  } else {
    c.ellipse(9.5, 5 + dy, 3.2, 3, p.hair);
    c.rect(14, 4 + dy, 7, 5, p.hair).rect(19, 9 + dy, 3, 1, p.hair);
  }
  for (const [x, y] of [
    [12, 4],
    [13, 3],
    [11, 6],
    [16, 3],
    [17, 4],
  ])
    c.px(x, y + dy, hi);
  c.rect(9, 12 + dy, 2, 4, darken(p.hair, 0.2));
}

export function drawCharacter(p, dir, frame) {
  const c = new Canvas(CHAR_W, CHAR_H);
  const dy = frame === 0 ? 0 : 1;
  if (dir === 'down' || dir === 'up') {
    drawLegsFront(c, p, frame);
    drawTorsoFront(c, p, frame, dy, dir === 'up');
    if (dir === 'down') drawHeadFront(c, p, dy);
    else drawHeadBack(c, p, dy);
  } else {
    drawSide(c, p, frame);
  }
  c.outline(0.62);
  if (dir === 'left') {
    const flipped = new Canvas(CHAR_W, CHAR_H);
    return flipped.blit(c, 0, 0, { flipX: true });
  }
  return c;
}

export const DIRECTIONS = ['down', 'up', 'right', 'left'];

/** 3 columns (idle, step A, step B) × 4 rows (down, up, right, left). */
export function characterSheet(p) {
  const sheet = new Canvas(CHAR_W * 3, CHAR_H * 4);
  DIRECTIONS.forEach((dir, row) => {
    for (const frame of [0, 1, 2]) {
      // left is a mirror of right, drawn after outlining
      const art = dir === 'left' ? drawCharacter(p, 'left', frame) : drawCharacter(p, dir, frame);
      sheet.blit(art, frame * CHAR_W, row * CHAR_H);
    }
  });
  return sheet;
}
