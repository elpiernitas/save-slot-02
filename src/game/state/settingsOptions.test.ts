import { describe, expect, it } from 'vitest';
import { cycleOption, MOTION_OPTIONS, optionLabel, TEXT_SPEED_OPTIONS } from './settingsOptions';

describe('settings options', () => {
  it('cycles text speed both ways, wrapping', () => {
    expect(cycleOption(TEXT_SPEED_OPTIONS, 'normal', 1)).toBe('fast');
    expect(cycleOption(TEXT_SPEED_OPTIONS, 'instant', 1)).toBe('slow');
    expect(cycleOption(TEXT_SPEED_OPTIONS, 'slow', -1)).toBe('instant');
  });

  it('labels MOVIMIENTO REDUCIDO unambiguously (SÍ = reduced motion on)', () => {
    expect(optionLabel(MOTION_OPTIONS, 'system')).toBe('SISTEMA');
    expect(optionLabel(MOTION_OPTIONS, 'off')).toBe('NO'); // not reduced
    expect(optionLabel(MOTION_OPTIONS, 'on')).toBe('SÍ'); // reduced
    expect(cycleOption(MOTION_OPTIONS, 'system', 1)).toBe('off');
  });

  it('recovers from unknown stored values', () => {
    expect(cycleOption(TEXT_SPEED_OPTIONS, 'warp' as never, 1)).toBe('slow');
  });
});
