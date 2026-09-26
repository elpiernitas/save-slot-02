import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../../state/newGame';
import type { GameSave } from '../../state/types';
import { revealBeats, STORY_FLAGS } from '../story';
import { COMPRESSED_BEATS, FULL_BEATS, GATE_BEATS, REVEAL_COPY, skippable } from './beats';
import {
  advanceGate,
  createGate,
  gateLines,
  P2_FALLBACK_MS,
  P2_PATH,
  SWITCH_1,
  SWITCH_2,
  type GateInput,
  type GateState,
} from './gate';

const still: GateInput = { dir: null, interact: false, reduced: false };

function run(s: GateState, ms: number, input: GateInput = still, frame = 1000 / 60) {
  for (let t = 0; t < ms; t += frame) s = advanceGate(s, frame, input);
  return s;
}

/** PLAYER 1 standing on the left switch. */
const atSwitch = (): GateState => ({ ...createGate(), p1: { ...SWITCH_1, facing: 'up' } });

describe('PLAYER 2 reveal — copy', () => {
  it('uses the locked copy exactly', () => {
    expect(REVEAL_COPY).toMatchObject({
      found: 'SIGNAL FOUND',
      slot: 'PLAYER SLOT 02',
      recovered: 'IDENTITY DATA RECOVERED',
      name: 'PLAYER 2 — MANU',
      speaker: 'MANU',
      line: '¿me ha cargado bien por lo menos?',
      link: 'PLAYER LINK — STABLE',
      party: 'PARTY STATUS — 2/2',
      endA: 'FINAL SIDE QUEST DATA RECOVERED',
      endB: 'DESTINATION DATA AVAILABLE',
    });
  });

  it('has no blacklisted phrases', () => {
    const text = Object.values(REVEAL_COPY).join(' ').toLowerCase();
    for (const bad of [
      'soulmate',
      'destiny',
      'meant to be',
      'always you',
      'our story',
      'destino',
    ]) {
      expect(text).not.toContain(bad);
    }
  });

  it('stages one human line, then the party state, then the gate', () => {
    const ids = FULL_BEATS.map((b) => b.id);
    expect(ids).toEqual(['scan', 'found', 'slot', 'name', 'line', 'party', 'gate', 'end']);
    expect(FULL_BEATS.find((b) => b.id === 'line')!.ms).toBeNull(); // no timed reaction
    expect(skippable(FULL_BEATS.find((b) => b.id === 'gate')!)).toBe(false);
  });
});

describe('PLAYER 2 reveal — re-entry', () => {
  const defeated = (): GameSave => {
    const s = createInitialSave(new Date('2026-09-26T00:00:00.000Z'));
    return { ...s, boss: { defeated: true, attempts: 2, defeatedAt: '2026-09-26T00:00:00.000Z' } };
  };

  it('full reveal only straight after the fight', () => {
    expect(revealBeats(defeated(), true)).toBe(FULL_BEATS);
  });

  it('a refresh mid-reveal gives the compressed one (still with the human line)', () => {
    const beats = revealBeats(defeated(), false);
    expect(beats).toBe(COMPRESSED_BEATS);
    expect(beats.map((b) => b.id)).toEqual(['found', 'name', 'line', 'party', 'gate', 'end']);
  });

  it('once PLAYER 2 is found, only the gate remains', () => {
    const s = defeated();
    const found = { ...s, flags: { ...s.flags, [STORY_FLAGS.player2Found]: true } };
    expect(revealBeats(found, true)).toBe(GATE_BEATS);
  });
});

describe('cooperative gate', () => {
  it('waits for PLAYER 1 at the left switch', () => {
    let s = run(createGate(), 3000, { ...still, interact: true });
    expect(s.stage).toBe('await1');
    expect(gateLines(s)).toEqual(['PLAYER 1 INPUT REQUIRED']);
    s = advanceGate(atSwitch(), 16, { ...still, interact: true });
    expect(s.stage).toBe('p2walk');
    expect(gateLines(s)).toEqual(['PLAYER 1 — READY']);
  });

  it('PLAYER 2 follows the fixed waypoints to the right switch, then the gate opens', () => {
    let s = advanceGate(atSwitch(), 16, { ...still, interact: true });
    const seen = new Set<string>();
    for (let t = 0; t < 10_000 && s.stage !== 'open'; t += 1000 / 60) {
      s = advanceGate(s, 1000 / 60, still);
      seen.add(gateLines(s).join('|'));
    }
    expect(s.stage).toBe('open');
    expect({ x: s.p2.x, y: s.p2.y }).toEqual(SWITCH_2);
    expect([...seen]).toContain('PLAYER 1 — READY|PLAYER 2 — READY');
    expect(gateLines(s)).toEqual(['2/2 PLAYERS — READY']);
    expect([s.p1.facing, s.p2.facing]).toEqual(['up', 'up']);
    expect(s.t).toBeLessThan(P2_FALLBACK_MS + 2000);
  });

  it('never deadlocks: the time fallback snaps PLAYER 2 to his switch', () => {
    let s = advanceGate(atSwitch(), 16, { ...still, interact: true });
    // Pathological tiny frames: the path would take ages; the fallback wins.
    s = { ...s, p2: { ...P2_PATH[0]!, facing: 'left', leg: 1 } };
    for (let t = 0; t <= P2_FALLBACK_MS + 50; t += 50) s = advanceGate(s, 50, still);
    expect(s.p2.leg).toBe(P2_PATH.length);
    expect(['p2ready', 'opening', 'open']).toContain(s.stage);
  });

  it('reduced motion: PLAYER 2 snaps and the gate opens without animation', () => {
    const reduced = { ...still, reduced: true };
    let s = advanceGate(atSwitch(), 16, { ...reduced, interact: true });
    expect({ x: s.p2.x, y: s.p2.y }).toEqual(SWITCH_2);
    s = run(s, 800, reduced);
    expect(s.stage).toBe('open');
  });

  it('is frame-rate independent (60/120/144 Hz)', () => {
    const times = [60, 120, 144].map((hz) => {
      let s = advanceGate(atSwitch(), 1000 / hz, { ...still, interact: true });
      while (s.stage !== 'open') s = advanceGate(s, 1000 / hz, still);
      return s.t;
    });
    expect(Math.max(...times) - Math.min(...times)).toBeLessThan(60);
  });
});
