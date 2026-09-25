/**
 * Every piece of code that needs "now" receives a Clock instead of calling
 * `new Date()` directly. Tests (and future debug tools) can then freeze or
 * move time without touching the system clock.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** A clock stuck at a given instant. Useful for tests and debug time travel. */
export function createFixedClock(instant: Date | string | number): Clock {
  const ms = new Date(instant).getTime();
  if (Number.isNaN(ms)) {
    throw new RangeError(`Invalid instant for fixed clock: ${String(instant)}`);
  }
  return { now: () => new Date(ms) };
}
