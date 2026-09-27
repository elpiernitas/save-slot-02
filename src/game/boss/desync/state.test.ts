import { describe, expect, it } from 'vitest';
import {
  advanceBoss,
  biasedZones,
  COMMITS_PER_NODE,
  CORE,
  createAttempt,
  currentHazard,
  hitBy,
  NODES,
  PATTERNS,
  SAFE,
  timing,
  type BossInput,
  type DesyncState,
} from './state';

const idle: BossInput = { dir: null, interact: false };

/** Runs `ms` of game time at a given frame interval with a fixed input. */
function run(s: DesyncState, ms: number, input: BossInput = idle, frame = 1000 / 60) {
  for (let t = 0; t < ms; t += frame) s = advanceBoss(s, frame, input);
  return s;
}

/** Walks to the current objective and commits; ignores hazards (tests use spare integrity). */
function bot(s: DesyncState, frame: number, maxMs = 240_000) {
  for (let t = 0; t < maxMs && s.status === 'playing'; t += frame) {
    const nodes = s.phase === 'checksum' ? ['a'] : s.phase === 'split' ? ['b', 'c'] : [];
    const open = nodes.find((n) => s.nodes[n as 'a'] < COMMITS_PER_NODE) as 'a' | undefined;
    const target = open ? NODES[open] : CORE;
    const dx = target.x - s.player.x;
    const dy = target.y - s.player.y;
    const dir =
      Math.abs(dx) > 6
        ? dx > 0
          ? 'right'
          : 'left'
        : Math.abs(dy) > 6
          ? dy > 0
            ? 'down'
            : 'up'
          : null;
    s = advanceBoss(s, frame, { dir, interact: true });
  }
  return s;
}

const sturdy = () => ({ ...createAttempt(), integrity: 99 });

describe('DESYNC PROCESS (pure)', () => {
  it('starts in CHECKSUM with SIGNAL 3/3 behind the phase banner', () => {
    const s = createAttempt();
    expect([s.phase, s.integrity, s.banner?.text, s.status]).toEqual([
      'checksum',
      3,
      'EL CHECKSUM NO COINCIDE',
      'playing',
    ]);
    expect(currentHazard(s)).toBeNull();
  });

  it('uses the authored sequence: telegraph always precedes the active collider', () => {
    let s = run(createAttempt(), 1600);
    const first = currentHazard(s)!;
    expect(first.hazard).toEqual(PATTERNS.checksum[0]);
    expect(first.stage).toBe('telegraph');
    const inLane = { x: 240, y: 200 };
    expect(hitBy(first, inLane)).toBe(false); // warning never hurts
    s = run(s, timing(false).telegraph);
    expect(currentHazard(s)!.stage).toBe('active');
    expect(hitBy(currentHazard(s)!, inLane)).toBe(true);
  });

  it('a hit costs one SIGNAL and grants ~1 s of invulnerability; three hits = SIGNAL LOST', () => {
    let s = run(createAttempt(), 1500 + 750); // first sweep active over x 200–296
    s = { ...s, player: { x: 240, y: 200, facing: 'up' } };
    s = advanceBoss(s, 16, idle);
    expect(s.integrity).toBe(2);
    s = run(s, 400);
    expect(s.integrity).toBe(2); // invulnerable
    s = { ...s, integrity: 1, invulnerableUntil: 0 };
    s = advanceBoss(s, 16, idle);
    expect(s.status === 'failed' || currentHazard(s)?.stage !== 'active').toBe(true);
  });

  it('nodes take one commit per hazard cycle and lock movement briefly', () => {
    let s = run(createAttempt(), 1600);
    s = { ...s, player: { ...NODES.a, facing: 'up' } };
    s = advanceBoss(s, 16, { dir: null, interact: true });
    expect(s.nodes.a).toBe(1);
    s = advanceBoss(s, 16, { dir: null, interact: true });
    expect(s.nodes.a).toBe(1); // same cycle
    const locked = advanceBoss(s, 16, { dir: 'left', interact: false });
    expect(locked.player.x).toBe(s.player.x); // commit lock
  });

  it('a hit never erases node progress', () => {
    let s = run(createAttempt(), 1600);
    s = { ...s, nodes: { a: 2, b: 0, c: 0 }, player: { x: 240, y: 200, facing: 'up' } };
    s = run(s, 800);
    expect(s.nodes.a).toBe(2);
  });

  it('biased pulses are deterministic from the player snapshot and stay in the arena', () => {
    const zones = biasedZones({ x: 470, y: 110 });
    expect(zones).toEqual(biasedZones({ x: 470, y: 110 }));
    for (const z of zones) {
      expect(z.x).toBeGreaterThanOrEqual(SAFE.x);
      expect(z.y + z.h).toBeLessThanOrEqual(SAFE.y + SAFE.h);
    }
  });

  it('assist lengthens warnings only', () => {
    expect(timing(true).telegraph).toBe(Math.round(timing(false).telegraph * 1.3));
    expect(timing(true).active).toBe(timing(false).active);
  });

  it('full run: A → B + C → final ring → core → complete; ring only in phase 3', () => {
    const phases = new Set<string>();
    let s = sturdy();
    let ringOutsideMissing = false;
    for (let t = 0; t < 240_000 && s.status === 'playing'; t += 1000 / 60) {
      s = bot(s, 1000 / 60, 1000 / 60);
      phases.add(s.phase);
      if (currentHazard(s)?.hazard.kind === 'ring' && s.phase !== 'missing')
        ringOutsideMissing = true;
    }
    expect(s.status).toBe('complete');
    expect([...phases]).toEqual(['checksum', 'split', 'missing']);
    expect(ringOutsideMissing).toBe(false);
    expect(s.t).toBeLessThan(120_000);
  });

  it('frame-rate independent: 60, 120 and 144 Hz reach the same outcome in the same time', () => {
    const results = [60, 120, 144].map((hz) => bot(sturdy(), 1000 / hz));
    for (const r of results) expect(r.status).toBe('complete');
    const times = results.map((r) => r.t);
    expect(Math.max(...times) - Math.min(...times)).toBeLessThan(250);
    expect(new Set(results.map((r) => r.stepCount)).size).toBe(1);
  });

  it('the core only accepts input once the final sequence has run', () => {
    let s: DesyncState = { ...sturdy(), phase: 'missing', banner: null, stepStart: 0 };
    s = { ...s, player: { ...CORE, facing: 'up' } };
    s = advanceBoss(s, 16, { dir: null, interact: true });
    expect(s.status).toBe('playing');
    s = run(s, 3 * 1800 + 100);
    expect(s.coreActive).toBe(true);
    s = advanceBoss(s, 16, { dir: null, interact: true });
    expect(s.status).toBe('complete');
  });
});
