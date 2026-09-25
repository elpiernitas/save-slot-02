// Map characters, 40×60, feet on row 57. Light from the west (left).
// Shadows are cool (blue-violet), light is warm.
import { Canvas, cool, darken, lighten, mix, warm } from './canvas.mjs';

export const CHAR_W = 40;
export const CHAR_H = 60;
export const CHAR_FEET_Y = 57;

/** PROVISIONAL PLAYER 1 (Luis): canon outfit, no final likeness. */
export const PLAYER = {
  hair: '#1f1a22',
  skin: '#e7b893',
  eye: '#231a20',
  mouth: '#b86c58',
  top: '#f6f3ee',
  heart: '#111015',
  pants: '#34507e',
  shoe: '#f0ede6',
  shoeTrim: '#3a3c46',
  hairStyle: 'curtain',
  build: 'slim',
};

/** Generic, non-canon NPC: waitress with apron and tray. */
export const WAITRESS = {
  hair: '#7a3a24',
  skin: '#dca07a',
  eye: '#231a20',
  mouth: '#a45a48',
  top: '#262a36',
  pants: '#20232c',
  shoe: '#1a1a20',
  shoeTrim: '#4a4a55',
  apron: '#e9dcc0',
  hairStyle: 'bun',
  build: 'slim',
};

/** Background pedestrians (non-interactive, no collision). */
export const PEDESTRIANS = {
  walkerA: {
    hair: '#c9a86a',
    skin: '#efc6a4',
    eye: '#231a20',
    mouth: '#b86c58',
    top: '#e0735a',
    pants: '#2b2f3c',
    shoe: '#e9e4da',
    shoeTrim: '#5a5a66',
    hairStyle: 'long',
    bag: '#2f5a47',
  },
  walkerB: {
    hair: '#2a2226',
    skin: '#b87c58',
    eye: '#231a20',
    mouth: '#8e4c3e',
    top: '#3f6f8a',
    pants: '#c9b99a',
    shoe: '#3a2a22',
    shoeTrim: '#1f1a1a',
    hairStyle: 'short',
  },
  walkerC: {
    hair: '#8a8a90',
    skin: '#e4b594',
    eye: '#231a20',
    mouth: '#a8604e',
    top: '#e8c64a',
    pants: '#3a3d4a',
    shoe: '#2a2a30',
    shoeTrim: '#55555f',
    hairStyle: 'cap',
    cap: '#23395a',
  },
};

const shade = (c, t = 0.28) => cool(c, t);
const deep = (c) => cool(darken(c, 0.25), 0.3);
const lit = (c, t = 0.18) => warm(c, t);

// ------------------------------------------------------------ parts

function legsFront(c, p, frame, back) {
  const cx = 20;
  const liftL = frame === 2 ? 2 : 0;
  const liftR = frame === 1 ? 2 : 0;
  // hips
  c.rect(cx - 8, 38, 16, 4, p.pants).rect(cx - 8, 38, 16, 1, deep(p.pants));
  if (!back) c.rect(cx - 1, 39, 2, 1, lighten(p.pants, 0.3)); // button
  // left leg (lit)
  const L = cx - 8;
  c.rect(L, 42, 7, 10 - liftL, p.pants).rect(L, 42, 1, 10 - liftL, lit(p.pants, 0.25));
  c.rect(L + 2, 45, 1, 5 - liftL, shade(p.pants, 0.15)); // seam
  // right leg (shade)
  const R = cx + 1;
  c.rect(R, 42, 7, 10 - liftR, shade(p.pants)).rect(R + 6, 42, 1, 10 - liftR, deep(p.pants));
  c.rect(cx - 1, 42, 2, 6, deep(p.pants));
  // sneakers
  const shoe = (x, lift, dark) => {
    const y = 52 - lift;
    const col = dark ? shade(p.shoe, 0.2) : p.shoe;
    c.rect(x - 1, y, 9, 3, col).rect(x - 1, y + 3, 9, 2, p.shoeTrim);
    c.rect(x, y, 7, 1, lighten(col, 0.3));
    if (!back) c.px(x + 3, y + 1, p.shoeTrim).px(x + 4, y + 1, p.shoeTrim);
  };
  shoe(L, liftL, false);
  shoe(R, liftR, true);
}

function torsoFront(c, p, frame, dy, back) {
  const cx = 20;
  const top = p.top;
  // shoulders + body (slightly tapered)
  c.ellipse(cx, 25 + dy, 11, 3.5, top);
  c.rect(cx - 10, 25 + dy, 20, 14, top);
  c.rect(cx - 9, 37 + dy, 18, 2, top);
  // shading: right third in cool shade, left edge warm
  c.rect(cx + 4, 25 + dy, 6, 14, shade(top, 0.22)).rect(cx + 8, 26 + dy, 2, 13, shade(top, 0.38));
  c.rect(cx - 10, 26 + dy, 1, 12, lit(top, 0.4));
  c.rect(cx - 9, 38 + dy, 18, 1, shade(top, 0.3)); // hem
  // arms with a small swing
  const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  const armL = 24 + dy + swing;
  const armR = 24 + dy - swing;
  c.rect(cx - 14, armL, 4, 14, top).rect(cx - 14, armL, 1, 14, lit(top, 0.45));
  c.rect(cx - 14, armL + 12, 4, 2, shade(top, 0.25)); // cuff
  c.rect(cx - 14, armL + 14, 4, 3, p.skin).px(cx - 14, armL + 16, shade(p.skin, 0.2));
  c.rect(cx + 10, armR, 4, 14, shade(top, 0.3)).rect(cx + 13, armR, 1, 14, shade(top, 0.45));
  c.rect(cx + 10, armR + 12, 4, 2, shade(top, 0.45));
  c.rect(cx + 10, armR + 14, 4, 3, shade(p.skin, 0.3));
  // folds
  for (const [x, y] of [
    [cx - 5, 34],
    [cx - 4, 35],
    [cx + 3, 33],
    [cx + 2, 35],
    [cx - 7, 30],
  ])
    c.px(x, y + dy, shade(top, 0.2));
  if (back) {
    c.rect(cx - 1, 27 + dy, 1, 10, shade(top, 0.15));
    if (p.apron) c.rect(cx - 6, 31 + dy, 12, 1, p.apron).rect(cx - 1, 31 + dy, 3, 3, p.apron);
    if (p.bag) c.rect(cx - 12, 25 + dy, 2, 13, p.bag);
    return;
  }
  // neckline
  c.rect(cx - 3, 23 + dy, 6, 1, shade(top, 0.35))
    .px(cx - 4, 22 + dy, shade(top, 0.35))
    .px(cx + 3, 22 + dy, shade(top, 0.35));
  if (p.heart) {
    const heart = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
    heart.forEach((row, j) =>
      [...row].forEach((ch, i) => ch === 'X' && c.px(cx - 4 + i, 27 + j + dy, p.heart)),
    );
    c.px(cx - 3, 27 + dy, '#4a4550'); // tiny highlight on the print
  }
  if (p.apron) {
    c.rect(cx - 7, 31 + dy, 14, 12, p.apron).rect(cx + 3, 31 + dy, 4, 12, shade(p.apron, 0.25));
    c.rect(cx - 7, 31 + dy, 14, 1, lit(p.apron, 0.4));
    c.rect(cx - 4, 35 + dy, 5, 3, shade(p.apron, 0.2)); // pocket
    c.px(cx - 2, 34 + dy, '#3a3d4a').px(cx - 2, 33 + dy, '#3a3d4a'); // pen
  }
  if (p.bag) {
    // shoulder bag strap + bag on the hip
    c.line(cx - 8, 24 + dy, cx + 6, 37 + dy, darken(p.bag, 0.2));
    c.rect(cx + 5, 35 + dy, 6, 6, p.bag).rect(cx + 5, 35 + dy, 6, 1, lit(p.bag, 0.3));
  }
}

function headFront(c, p, dy) {
  const cx = 20;
  // neck
  c.rect(cx - 3, 19 + dy, 6, 4, shade(p.skin, 0.25));
  // face
  c.ellipse(cx, 12.5 + dy, 7.4, 8.2, p.skin);
  c.rect(cx + 3, 7 + dy, 5, 12, shade(p.skin, 0.18)); // shade side
  c.rect(cx - 7, 11 + dy, 1, 5, lit(p.skin, 0.3));
  // ears
  c.rect(cx - 9, 12 + dy, 2, 4, shade(p.skin, 0.1)).rect(cx + 7, 12 + dy, 2, 4, shade(p.skin, 0.3));
  // eyes (2×3 with a catchlight)
  for (const ex of [cx - 4, cx + 2]) {
    c.rect(ex, 13 + dy, 2, 3, p.eye).px(ex, 13 + dy, '#ffffff');
  }
  // nose, mouth, cheeks
  c.px(cx, 16 + dy, shade(p.skin, 0.35)).px(cx + 1, 16 + dy, shade(p.skin, 0.2));
  c.rect(cx - 1, 18 + dy, 3, 1, p.mouth);
  c.px(cx - 5, 16 + dy, mix(p.skin, '#e0705e', 0.35)).px(
    cx + 5,
    16 + dy,
    mix(p.skin, '#e0705e', 0.3),
  );
  hairFront(c, p, dy);
}

function capShape(c, p, dy) {
  const cx = 20;
  c.ellipse(cx, 6 + dy, 8.5, 4.5, p.cap).rect(cx - 8, 6 + dy, 17, 3, p.cap);
  c.rect(cx - 9, 9 + dy, 19, 2, darken(p.cap, 0.25)); // brim
  c.px(cx - 4, 4 + dy, lit(p.cap, 0.4)).px(cx - 3, 3 + dy, lit(p.cap, 0.4));
}

function hairFront(c, p, dy) {
  const cx = 20;
  const h = p.hair;
  const hi = lit(lighten(h, 0.2), 0.3);
  const lo = shade(h, 0.3);
  if (p.hairStyle === 'cap') {
    c.rect(cx - 8, 10 + dy, 2, 5, h).rect(cx + 6, 10 + dy, 2, 5, h);
    capShape(c, p, dy);
    c.rect(cx - 5, 11 + dy, 3, 1, h).rect(cx + 2, 11 + dy, 3, 1, h); // brows
    return;
  }
  // cap of hair (stays above the eyes)
  c.ellipse(cx, 5.5 + dy, 9, 5.2, h);
  c.rect(cx - 9, 5 + dy, 18, 3, h);
  if (p.hairStyle === 'curtain') {
    // centre part and two curtains framing the forehead
    c.rect(cx - 9, 7 + dy, 4, 4, h).rect(cx + 5, 7 + dy, 4, 4, h);
    c.rect(cx - 9, 11 + dy, 2, 5, h).rect(cx + 7, 11 + dy, 2, 5, h);
    c.rect(cx - 5, 8 + dy, 3, 2, h).rect(cx + 2, 8 + dy, 3, 2, h);
    for (let y = 2; y <= 9; y++) c.px(cx, y + dy, hi); // the part
    c.px(cx - 1, 9 + dy, h).px(cx + 1, 9 + dy, h);
    // strands falling to each side
    c.line(cx - 1, 3 + dy, cx - 6, 9 + dy, lo).line(cx + 1, 3 + dy, cx + 6, 9 + dy, lo);
    c.line(cx - 3, 2 + dy, cx - 8, 8 + dy, hi);
    c.px(cx - 5, 3 + dy, hi)
      .px(cx - 6, 4 + dy, hi)
      .px(cx + 4, 3 + dy, lighten(h, 0.12));
    c.rect(cx + 6, 6 + dy, 3, 6, lo);
    // brows peeking under the fringe
    c.rect(cx - 5, 11 + dy, 3, 1, h).rect(cx + 2, 11 + dy, 3, 1, h);
  } else if (p.hairStyle === 'bun') {
    c.ellipse(cx, 1.5 + dy, 4.5, 3.5, h)
      .px(cx - 2, 0 + dy, hi)
      .px(cx - 1, 0 + dy, hi);
    c.rect(cx - 9, 7 + dy, 3, 7, h).rect(cx + 6, 7 + dy, 3, 7, lo);
    c.line(cx - 6, 4 + dy, cx - 2, 3 + dy, hi);
    c.rect(cx - 5, 10 + dy, 3, 1, darken(h, 0.1)).rect(cx + 2, 10 + dy, 3, 1, darken(h, 0.1));
  } else if (p.hairStyle === 'long') {
    c.rect(cx - 9, 7 + dy, 4, 16, h).rect(cx + 5, 7 + dy, 4, 16, lo);
    c.rect(cx - 5, 5 + dy, 10, 4, h);
    c.line(cx - 7, 4 + dy, cx - 7, 20 + dy, hi);
    c.rect(cx - 5, 10 + dy, 3, 1, darken(h, 0.3)).rect(cx + 2, 10 + dy, 3, 1, darken(h, 0.3));
  } else {
    // short
    c.rect(cx - 9, 6 + dy, 2, 7, h).rect(cx + 7, 6 + dy, 2, 7, lo);
    c.rect(cx - 6, 5 + dy, 12, 3, h);
    c.px(cx - 4, 3 + dy, hi)
      .px(cx - 3, 3 + dy, hi)
      .px(cx - 5, 4 + dy, hi);
    c.rect(cx - 5, 10 + dy, 3, 1, h).rect(cx + 2, 10 + dy, 3, 1, h);
  }
}

function headBack(c, p, dy) {
  const cx = 20;
  const h = p.hair;
  const hi = lit(lighten(h, 0.2), 0.3);
  c.rect(cx - 3, 19 + dy, 6, 4, shade(p.skin, 0.3));
  c.rect(cx - 9, 12 + dy, 2, 4, shade(p.skin, 0.1)).rect(cx + 7, 12 + dy, 2, 4, shade(p.skin, 0.3));
  c.ellipse(cx, 10 + dy, 9, 9.5, h);
  if (p.hairStyle === 'long') c.rect(cx - 9, 10 + dy, 18, 13, h);
  else c.rect(cx - 7, 12 + dy, 14, 7, h);
  c.rect(cx + 4, 6 + dy, 4, 12, shade(h, 0.3));
  c.line(cx - 6, 4 + dy, cx - 7, 14 + dy, hi)
    .px(cx - 4, 2 + dy, hi)
    .px(cx - 3, 2 + dy, hi);
  if (p.hairStyle === 'bun') c.ellipse(cx, 3 + dy, 5, 4, darken(h, 0.08)).px(cx - 2, 1 + dy, hi);
  if (p.hairStyle === 'cap') capShape(c, p, dy);
  // nape
  if (p.hairStyle !== 'long') c.rect(cx - 5, 18 + dy, 10, 1, shade(h, 0.2));
}

function side(c, p, frame) {
  const dy = frame === 0 ? 0 : 1;
  const cx = 21;
  // legs: scissor on walk frames
  const legs =
    frame === 0
      ? [[cx - 4, 0]]
      : frame === 1
        ? [
            [cx - 8, 1],
            [cx + 1, 0],
          ]
        : [
            [cx - 5, 1],
            [cx - 2, 0],
          ];
  c.rect(cx - 6, 38, 12, 4, p.pants);
  legs.forEach(([x, back]) => {
    const col = back ? shade(p.pants) : p.pants;
    c.rect(x, 42, 8, 10, col).rect(x, 42, 1, 10, lit(col, 0.2));
    const shoe = back ? shade(p.shoe, 0.2) : p.shoe;
    c.rect(x, 52, 10, 3, shoe)
      .rect(x, 55, 10, 2, p.shoeTrim)
      .rect(x + 1, 52, 8, 1, lighten(shoe, 0.3));
  });
  // body
  c.rect(cx - 7, 24 + dy, 14, 15, p.top).rect(cx - 7, 24 + dy, 2, 15, lit(p.top, 0.35));
  c.rect(cx + 4, 25 + dy, 3, 14, shade(p.top, 0.25));
  c.ellipse(cx, 25 + dy, 7, 3, p.top);
  if (p.heart) c.rect(cx + 5, 28 + dy, 2, 4, p.heart).px(cx + 4, 29 + dy, p.heart);
  if (p.apron)
    c.rect(cx + 3, 31 + dy, 4, 12, p.apron).rect(cx + 6, 31 + dy, 1, 12, shade(p.apron, 0.25));
  if (p.bag)
    c.rect(cx - 9, 33 + dy, 5, 7, p.bag).line(cx - 6, 24 + dy, cx - 7, 33 + dy, darken(p.bag, 0.2));
  // arm swings with the step
  const ax = frame === 1 ? cx + 1 : frame === 2 ? cx - 5 : cx - 2;
  c.rect(ax, 25 + dy, 5, 13, shade(p.top, 0.18)).rect(ax, 37 + dy, 5, 1, shade(p.top, 0.4));
  c.rect(ax, 38 + dy, 5, 3, p.skin);
  // head: back hair mass, then the face, then the fringe on top
  const h = p.hair;
  const hi = lit(lighten(h, 0.2), 0.3);
  c.rect(cx - 2, 19 + dy, 6, 5, shade(p.skin, 0.25));
  if (p.hairStyle === 'long') c.rect(cx - 9, 9 + dy, 8, 15, h);
  if (p.hairStyle === 'bun') c.ellipse(cx - 8, 5 + dy, 4, 4, h);
  c.ellipse(cx - 3, 10 + dy, 7, 8.5, h);
  c.ellipse(cx + 3, 13 + dy, 6.5, 7.5, p.skin);
  c.rect(cx + 6, 9 + dy, 3, 10, shade(p.skin, 0.1));
  c.rect(cx + 9, 14 + dy, 1, 2, p.skin).px(cx + 9, 16 + dy, shade(p.skin, 0.3)); // nose
  c.rect(cx + 6, 13 + dy, 2, 3, p.eye).px(cx + 6, 13 + dy, '#ffffff');
  c.rect(cx + 6, 18 + dy, 2, 1, p.mouth);
  c.px(cx + 4, 16 + dy, mix(p.skin, '#e0705e', 0.35));
  c.rect(cx - 1, 12 + dy, 2, 4, shade(p.skin, 0.2)); // ear
  if (p.hairStyle === 'cap') {
    c.ellipse(cx, 6 + dy, 8.5, 4.5, p.cap).rect(cx - 8, 6 + dy, 16, 3, p.cap);
    c.rect(cx + 2, 9 + dy, 10, 2, darken(p.cap, 0.25));
  } else {
    // crown + fringe falling forward over the forehead
    c.ellipse(cx + 1, 5.5 + dy, 7.5, 4.5, h);
    if (p.hairStyle === 'curtain') {
      c.rect(cx + 3, 6 + dy, 6, 4, h).rect(cx + 7, 10 + dy, 2, 2, h);
      c.line(cx + 1, 3 + dy, cx + 8, 9 + dy, shade(h, 0.3));
    } else {
      c.rect(cx + 3, 6 + dy, 5, 3, h);
    }
    c.px(cx - 4, 3 + dy, hi)
      .px(cx - 3, 2 + dy, hi)
      .line(cx - 8, 7 + dy, cx - 8, 13 + dy, hi);
  }
  c.rect(cx - 1, 11 + dy, 1, 1, h);
}

export function drawCharacter(p, dir, frame) {
  const c = new Canvas(CHAR_W, CHAR_H);
  const dy = frame === 0 ? 0 : 1;
  if (dir === 'down' || dir === 'up') {
    const back = dir === 'up';
    legsFront(c, p, frame, back);
    torsoFront(c, p, frame, dy, back);
    if (back) headBack(c, p, dy);
    else headFront(c, p, dy);
    if (p.tray && !back) {
      // tray held at the left hip
      c.rect(2, 36 + dy, 10, 2, '#b9bcc2')
        .rect(3, 34 + dy, 3, 2, '#ffffff')
        .rect(7, 33 + dy, 2, 3, '#e8b53a');
    }
  } else {
    side(c, p, frame);
  }
  c.outline(0.62);
  if (dir === 'left') return new Canvas(CHAR_W, CHAR_H).blit(c, 0, 0, { flipX: true });
  return c;
}

export const DIRECTIONS = ['down', 'up', 'right', 'left'];

/** 3 columns (idle, step A, step B) × 4 rows (down, up, right, left). */
export function characterSheet(p) {
  const sheet = new Canvas(CHAR_W * 3, CHAR_H * 4);
  DIRECTIONS.forEach((dir, row) => {
    for (const frame of [0, 1, 2])
      sheet.blit(drawCharacter(p, dir, frame), frame * CHAR_W, row * CHAR_H);
  });
  return sheet;
}
