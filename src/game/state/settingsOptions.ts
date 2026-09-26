import type { GameSettings, TextSpeed } from './types';

export interface SettingOption<T> {
  value: T;
  label: string;
}

export const TEXT_SPEED_OPTIONS: readonly SettingOption<TextSpeed>[] = [
  { value: 'slow', label: 'LENTA' },
  { value: 'normal', label: 'NORMAL' },
  { value: 'fast', label: 'RÁPIDA' },
  { value: 'instant', label: 'INSTANTÁNEA' },
];

/**
 * The menu says MOTION (are animations on?) while the save stores
 * `reducedMotion` (is motion reduced?). So MOTION ON = reducedMotion 'off'.
 */
export const MOTION_OPTIONS: readonly SettingOption<GameSettings['reducedMotion']>[] = [
  { value: 'system', label: 'SISTEMA' },
  { value: 'off', label: 'SÍ' },
  { value: 'on', label: 'NO' },
];

/** Next/previous option, wrapping. Unknown current values start at the first option. */
export function cycleOption<T>(options: readonly SettingOption<T>[], current: T, dir: 1 | -1): T {
  const index = options.findIndex((o) => o.value === current);
  const next = index === -1 ? 0 : (index + dir + options.length) % options.length;
  return options[next]!.value;
}

export function optionLabel<T>(options: readonly SettingOption<T>[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? '?';
}
