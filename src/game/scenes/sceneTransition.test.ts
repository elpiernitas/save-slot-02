import { describe, expect, it } from 'vitest';
import { getTransitionView } from './sceneTransition';

describe('scene transition view (pure, no render-phase state)', () => {
  const base = { target: 'title', shown: 'title', revealing: false, reduced: false } as const;

  it('is idle when nothing changes', () => {
    expect(getTransitionView(base)).toEqual({ displayed: 'title', phase: 'idle' });
  });

  it('keeps the old scene mounted while covering', () => {
    expect(getTransitionView({ ...base, target: 'dialogueDemo' })).toEqual({
      displayed: 'title',
      phase: 'cover',
    });
  });

  it('reveals the new scene after the swap', () => {
    expect(getTransitionView({ ...base, revealing: true })).toEqual({
      displayed: 'title',
      phase: 'reveal',
    });
  });

  it('re-covers if the target changes again during a reveal', () => {
    expect(getTransitionView({ ...base, target: 'boot', revealing: true }).phase).toBe('cover');
  });

  it('switches instantly with reduced motion, even before the timer syncs `shown`', () => {
    expect(getTransitionView({ ...base, target: 'boot', reduced: true })).toEqual({
      displayed: 'boot',
      phase: 'idle',
    });
  });
});
