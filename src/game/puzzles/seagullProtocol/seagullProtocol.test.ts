import { describe, expect, it } from 'vitest';
import {
  advanceSeagull,
  ASSIST_TELEGRAPH,
  COLS,
  DIVES,
  initialSeagull,
  isDone,
  moveSeagull,
  ROWS,
  TIMING,
  type Dir,
  type SeagullState,
  type Tile,
} from './seagullProtocol';

const run = (s: SeagullState, ms: number) => {
  for (let t = 0; t < ms; t += 16) s = advanceSeagull(s, 16);
  return s;
};
const key = ([c, r]: Tile) => `${c},${r}`;

/** Shortest path of single steps from a to b (Manhattan). */
function steps(a: Tile, b: Tile): Dir[] {
  const out: Dir[] = [];
  for (let c = a[0]; c < b[0]; c++) out.push('right');
  for (let c = a[0]; c > b[0]; c--) out.push('left');
  for (let r = a[1]; r < b[1]; r++) out.push('down');
  for (let r = a[1]; r > b[1]; r--) out.push('up');
  return out;
}
function nearestSafe(from: Tile, dive: readonly Tile[]): Tile {
  const marked = new Set(dive.map(key));
  let best: Tile = from;
  let dist = Infinity;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const d = Math.abs(c - from[0]) + Math.abs(r - from[1]);
      if (!marked.has(`${c},${r}`) && d < dist) [best, dist] = [[c, r], d];
    }
  return best;
}

describe('seagull protocol', () => {
  it('every dive leaves a safe tile within two steps of any safe tile of the previous one', () => {
    let safeBefore: Tile[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) safeBefore.push([c, r]);
    for (const dive of DIVES) {
      const marked = new Set(dive.map(key));
      for (const from of safeBefore) {
        const to = nearestSafe(from, dive);
        expect(Math.abs(to[0] - from[0]) + Math.abs(to[1] - from[1])).toBeLessThanOrEqual(2);
      }
      safeBefore = [];
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) if (!marked.has(`${c},${r}`)) safeBefore.push([c, r]);
    }
  });

  it('is cleared by dodging every dive of both waves', () => {
    let s = run(initialSeagull(), TIMING.ready + 20);
    for (const dive of DIVES) {
      expect(s.phase).toBe('telegraph');
      for (const d of steps(s.pos, nearestSafe(s.pos, dive))) s = moveSeagull(s, d);
      s = run(s, TIMING.telegraph + TIMING.strike + TIMING.gap + 40);
    }
    expect(s.phase).toBe('cleared');
    expect(isDone(s)).toBe(true);
    expect(s.failures).toBe(0);
  });

  it('a peck restarts the run; two failures turn on the assist', () => {
    // Stand still on the centre: the first dive marks it.
    let s = run(initialSeagull(), TIMING.ready + TIMING.telegraph + 40);
    expect(s.phase).toBe('hit');
    expect(s.failures).toBe(1);
    s = run(s, TIMING.hit + 20);
    expect([s.phase, s.dive, s.pos]).toEqual(['ready', 0, [2, 1]]);
    s = run(s, TIMING.ready + TIMING.telegraph + 40);
    expect(s.failures).toBe(2);
    expect(s.assist).toBe(true);
    s = run(s, TIMING.hit + TIMING.ready + 40);
    expect(s.phase).toBe('telegraph');
    s = run(s, TIMING.telegraph + 40);
    expect(s.phase).toBe('telegraph'); // longer warning while assisted
    s = run(s, ASSIST_TELEGRAPH - TIMING.telegraph);
    expect(s.phase).toBe('hit');
  });

  it('never blocks: after four failures the seagull loses interest', () => {
    let s = initialSeagull();
    for (let i = 0; i < 4; i++) s = run(s, TIMING.hit + TIMING.ready + ASSIST_TELEGRAPH + 60);
    expect(s.phase).toBe('bored');
    expect(isDone(s)).toBe(true);
  });

  it('moves one tile per step inside the grid, never during a peck', () => {
    let s = initialSeagull();
    s = moveSeagull(moveSeagull(moveSeagull(s, 'left'), 'left'), 'left');
    expect(s.pos).toEqual([0, 1]);
    s = run(s, TIMING.ready + TIMING.telegraph + 40); // dive 1 misses (0,1)
    expect(s.phase).toBe('strike');
    expect(moveSeagull(s, 'right')).toBe(s);
  });
});
