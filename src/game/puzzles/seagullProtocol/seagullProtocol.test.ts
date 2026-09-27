import { describe, expect, it } from 'vitest';
import {
  dive,
  initialSeagull,
  moveSeagull,
  previewDone,
  SEAGULL_ASSIST_AFTER,
  SEAGULL_PATTERN,
  SEAGULL_DIVES,
  seagullComplete,
} from './seagullProtocol';

function atCell(state: ReturnType<typeof initialSeagull>, cell: number) {
  let next = state;
  next = previewDone(next);
  const row = Math.floor(cell / 5);
  const col = cell % 5;
  for (let i = 0; i < row; i++) next = moveSeagull(next, 'down');
  for (let i = 0; i < col; i++) next = moveSeagull(next, 'right');
  return next;
}

describe('MG-01 seagull protocol', () => {
  it('shows a target, accepts the authored six-dive route and completes', () => {
    let state = initialSeagull();
    for (let i = 0; i < SEAGULL_DIVES; i++) {
      state = atCell(state, SEAGULL_PATTERN[i]!);
      state = dive(state);
    }
    expect(state.dive).toBe(SEAGULL_DIVES);
    expect(seagullComplete(state)).toBe(true);
    expect(state.assisted).toBe(false);
  });

  it('bounds movement and offers a non-blocking fallback after four misses', () => {
    let state = previewDone(initialSeagull());
    expect(moveSeagull(state, 'up').cursor).toBe(0);
    expect(moveSeagull(state, 'left').cursor).toBe(0);
    for (let i = 0; i < SEAGULL_ASSIST_AFTER; i++) {
      state = dive(moveSeagull(state, 'right'));
      if (state.phase === 'preview') state = previewDone(state);
    }
    expect(state.assisted).toBe(true);
    expect(seagullComplete(state)).toBe(true);
  });

  it('cannot mutate after success', () => {
    let state = initialSeagull();
    for (let i = 0; i < SEAGULL_DIVES; i++) state = dive(atCell(state, SEAGULL_PATTERN[i]!));
    expect(dive(moveSeagull(state, 'right'))).toEqual(state);
  });
});
