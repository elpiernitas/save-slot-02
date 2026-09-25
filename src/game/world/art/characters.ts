import type { PixelArt } from '../../content/sigils';
import type { Facing } from '../types';
import { PixelGrid } from './pixelGrid';

/**
 * Map sprites, 16×24, drawn with the feet on the bottom rows. Built from
 * parts so every direction/frame stays consistent.
 *
 * PLAYER 1 is a PROVISIONAL sprite inspired by Luis' canon outfit (dark
 * centre-parted hair, white long-sleeve top, black heart on the chest). It
 * does not claim facial likeness; final sprites come from Manu's references.
 */
export const CHARACTER_W = 16;
export const CHARACTER_H = 24;
/** Pixel row of the feet (anchor = bottom-centre of the collision box). */
export const CHARACTER_FEET_Y = 22;

export type WalkFrame = 0 | 1 | 2; // 0 idle, 1/2 alternate steps

export interface CharacterStyle {
  palette: Record<string, string>;
  heart: boolean;
  apron: boolean;
  bun: boolean;
}

// Palette keys: h hair, s skin, e eyes, w top, v top shade, k heart,
// a apron, p trousers, f shoes, o outline
function drawFront(g: PixelGrid, style: CharacterStyle, frame: WalkFrame) {
  // Hair: centre-parted curtain (or a bun for the NPC).
  g.rect(5, 2, 6, 1, 'h').rect(4, 3, 8, 1, 'h');
  g.rect(4, 4, 3, 1, 'h').rect(9, 4, 3, 1, 'h').rect(7, 4, 2, 1, 's');
  g.set(4, 5, 'h').set(11, 5, 'h').rect(5, 5, 6, 1, 's');
  g.rect(5, 6, 6, 2, 's').set(6, 6, 'e').set(9, 6, 'e');
  g.rect(6, 8, 4, 1, 's').rect(7, 9, 2, 1, 's');
  if (style.bun) g.rect(6, 0, 4, 2, 'h');
  // Torso + sleeves
  g.rect(4, 10, 8, 7, 'w').rect(4, 16, 8, 1, 'v');
  const swing = frame === 0 ? 0 : 1;
  g.rect(3, 10, 1, 6 - (frame === 1 ? swing : 0), 'v').set(3, frame === 1 ? 15 : 16, 's');
  g.rect(12, 10, 1, 6 - (frame === 2 ? swing : 0), 'v').set(12, frame === 2 ? 15 : 16, 's');
  if (style.heart) g.stamp(['k.k', 'kkk', '.k.'], 6, 11).set(5, 11, '.');
  if (style.heart) g.set(5, 11, 'w');
  if (style.apron) g.rect(5, 13, 6, 4, 'a');
  drawLegs(g, frame, 5, 8);
}

function drawBack(g: PixelGrid, style: CharacterStyle, frame: WalkFrame) {
  g.rect(5, 2, 6, 1, 'h').rect(4, 3, 8, 6, 'h').rect(7, 9, 2, 1, 's');
  if (style.bun) g.rect(6, 0, 4, 3, 'h');
  g.rect(4, 10, 8, 7, 'w').rect(4, 16, 8, 1, 'v');
  g.rect(3, 10, 1, 6, 'v').set(3, 16, 's').rect(12, 10, 1, 6, 'v').set(12, 16, 's');
  if (style.apron) g.rect(7, 13, 2, 1, 'a');
  drawLegs(g, frame, 5, 8);
}

function drawSide(g: PixelGrid, style: CharacterStyle, frame: WalkFrame) {
  // Facing right.
  g.rect(6, 2, 5, 1, 'h').rect(5, 3, 7, 2, 'h').rect(5, 5, 3, 3, 'h');
  g.rect(8, 5, 3, 3, 's').set(9, 6, 'e').rect(8, 8, 2, 1, 's').rect(7, 9, 2, 1, 's');
  if (style.bun) g.rect(4, 2, 2, 3, 'h');
  g.rect(6, 10, 5, 7, 'w').rect(6, 16, 5, 1, 'v');
  if (style.heart) g.set(10, 12, 'k');
  if (style.apron) g.rect(9, 13, 2, 4, 'a');
  // Arm swings with the step.
  const armX = frame === 1 ? 9 : frame === 2 ? 7 : 8;
  g.rect(armX, 11, 2, 5, 'v').rect(armX, 16, 2, 1, 's');
  // Legs
  if (frame === 0) {
    g.rect(7, 17, 3, 4, 'p').rect(7, 21, 4, 1, 'f');
  } else {
    const [front, back] = frame === 1 ? [9, 5] : [8, 6];
    g.rect(back, 17, 3, 3, 'p').rect(back - 1, 20, 3, 1, 'f');
    g.rect(front, 17, 3, 4, 'p').rect(front, 21, 3, 1, 'f');
  }
}

function drawLegs(g: PixelGrid, frame: WalkFrame, left: number, right: number) {
  g.rect(left, 17, 6, 1, 'p');
  const lUp = frame === 2 ? 1 : 0;
  const rUp = frame === 1 ? 1 : 0;
  g.rect(left, 18, 3, 3 - lUp, 'p').rect(left, 21 - lUp, 3, 1, 'f');
  g.rect(right, 18, 3, 3 - rUp, 'p').rect(right, 21 - rUp, 3, 1, 'f');
}

export function buildCharacter(style: CharacterStyle): Record<string, PixelArt> {
  const frames: Record<string, PixelArt> = {};
  for (const frame of [0, 1, 2] as const) {
    const front = new PixelGrid(CHARACTER_W, CHARACTER_H);
    drawFront(front, style, frame);
    const back = new PixelGrid(CHARACTER_W, CHARACTER_H);
    drawBack(back, style, frame);
    const right = new PixelGrid(CHARACTER_W, CHARACTER_H);
    drawSide(right, style, frame);
    const left = right.mirrored();
    const byFacing: Record<Facing, PixelGrid> = { down: front, up: back, right, left };
    for (const [facing, grid] of Object.entries(byFacing)) {
      frames[`${facing}_${frame}`] = grid.outline('o').toArt(style.palette);
    }
  }
  return frames;
}

export const PLAYER_STYLE: CharacterStyle = {
  heart: true,
  apron: false,
  bun: false,
  palette: {
    h: '#241a1d',
    s: '#e3b18f',
    e: '#1d1416',
    w: '#f4f1ea',
    v: '#d6d0c4',
    k: '#151215',
    p: '#34435c',
    f: '#1b1b20',
    o: '#1a1422',
  },
};

/** Generic, non-canon NPC. */
export const WAITRESS_STYLE: CharacterStyle = {
  heart: false,
  apron: true,
  bun: true,
  palette: {
    h: '#6b3a26',
    s: '#d9a07c',
    e: '#1d1416',
    w: '#2b2d35',
    v: '#1f2128',
    k: '#000000',
    a: '#e9e0cc',
    p: '#23252c',
    f: '#141418',
    o: '#141019',
  },
};

export function characterFrameKey(facing: Facing, frame: WalkFrame): string {
  return `${facing}_${frame}`;
}
