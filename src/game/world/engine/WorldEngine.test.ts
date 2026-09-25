import { describe, expect, it, vi } from 'vitest';
import { MURALLA_MAP } from '../maps/muralla';
import type { Facing, Spawn } from '../types';
import { WorldEngine, type FrameScheduler } from './WorldEngine';

function fakeScheduler() {
  const pending = new Map<number, (t: number) => void>();
  let next = 1;
  const scheduler: FrameScheduler & { run(t: number): void; count(): number } = {
    request: (cb) => {
      pending.set(next, cb);
      return next++;
    },
    cancel: (id) => void pending.delete(id),
    run: (t) => {
      const cbs = [...pending.values()];
      pending.clear();
      for (const cb of cbs) cb(t);
    },
    count: () => pending.size,
  };
  return scheduler;
}

const spawnAt = (id: string): Spawn => MURALLA_MAP.spawns.find((s) => s.id === id)!;
/** Just below the waitress, facing her. */
const NEAR_WAITRESS: Spawn = { id: 'test', x: 556, y: 282, facing: 'up' };

function setup(options: { spawn?: Spawn; held?: Facing | null; active?: boolean } = {}) {
  const input = { held: options.held ?? null, active: options.active ?? true };
  const scheduler = fakeScheduler();
  const events = { target: vi.fn(), zone: vi.fn(), render: vi.fn() };
  const engine = new WorldEngine({
    map: MURALLA_MAP,
    spawn: options.spawn ?? spawnAt('arrival'),
    view: { w: 640, h: 360 },
    input: { heldDirection: () => input.held, isActive: () => input.active },
    scheduler,
    onTargetChange: events.target,
    onZoneEnter: events.zone,
    onRender: events.render,
  });
  return { engine, input, scheduler, events };
}

describe('WorldEngine', () => {
  it('moves while its input layer is active', () => {
    const { engine, input } = setup({ held: 'up' });
    engine.step(0);
    engine.step(100);
    expect(engine.snapshot().pos.y).toBeLessThan(spawnAt('arrival').y);
    expect(engine.snapshot().moving).toBe(true);
    input.active = false; // a dialogue/menu took over input
    const before = engine.snapshot().pos;
    engine.step(200);
    expect(engine.snapshot().pos).toEqual(before);
  });

  it('pauses while a dialogue is open and ignores interaction', () => {
    const { engine } = setup({ held: 'left' });
    engine.step(0);
    engine.setPaused(true, 0);
    engine.step(100);
    expect(engine.snapshot().pos).toEqual({ x: spawnAt('arrival').x, y: spawnAt('arrival').y });
    expect(engine.tryInteract(100)).toBeNull();
  });

  it('applies a cooldown after resuming so the closing key cannot re-open', () => {
    const { engine } = setup({ spawn: NEAR_WAITRESS });
    engine.step(0);
    expect(engine.tryInteract(0)?.id).toBe('waitress');
    engine.setPaused(true, 0);
    engine.setPaused(false, 1000, 250);
    engine.step(1010);
    expect(engine.tryInteract(1100)).toBeNull();
    expect(engine.tryInteract(1260)?.id).toBe('waitress');
  });

  it('reports target changes and entering a new zone (once)', () => {
    const { engine, events } = setup({ spawn: NEAR_WAITRESS });
    engine.step(0);
    expect(events.target).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'waitress' }));
    expect(events.zone).not.toHaveBeenCalled(); // spawn zone is not "entered"

    // Walk west along a free row into the zone by the big tree.
    const walker = setup({ spawn: { ...spawnAt('arrival'), y: 320 }, held: 'left' });
    let t = 0;
    for (let i = 0; i < 80; i++) walker.engine.step((t += 50));
    const zones = walker.events.zone.mock.calls.map(([z]) => z.id);
    expect(zones).toContain('tree');
    expect(new Set(zones).size).toBe(zones.length);
  });

  it('runs on the scheduler and tears down cleanly', () => {
    const { engine, scheduler, events } = setup();
    engine.start();
    expect(engine.isRunning).toBe(true);
    scheduler.run(0);
    scheduler.run(16);
    expect(events.render).toHaveBeenCalledTimes(2);
    engine.destroy();
    expect(engine.isRunning).toBe(false);
    expect(scheduler.count()).toBe(0);
    scheduler.run(32);
    expect(events.render).toHaveBeenCalledTimes(2);
    engine.start(); // cannot be revived after destroy
    expect(scheduler.count()).toBe(0);
  });

  it('never touches persistent state: it only reports through callbacks', () => {
    const { engine } = setup();
    expect(Object.keys(engine.snapshot()).sort()).toEqual(
      ['camera', 'facing', 'moving', 'pos', 'target', 'timeMs', 'walkFrame'].sort(),
    );
  });
});
