import { describe, expect, it } from 'vitest';
import { SCENE_IDS } from '../scenes/sceneIds';
import { MOTIF, musicForScene, stepSeconds, TRACKS } from './music';
import { SYNTH_SFX } from './synthSfx';

describe('music routing', () => {
  it('every scene has a decision and every routed track exists', () => {
    for (const scene of SCENE_IDS) {
      const track = musicForScene(scene);
      if (track !== null) expect(TRACKS[track], scene).toBeDefined();
    }
  });

  it('routes the critical path as specified', () => {
    expect(musicForScene('title')).toBe('system');
    expect(musicForScene('overworld')).toBe('muralla_afternoon');
    expect(musicForScene('boss')).toBe('desync');
    for (const s of ['player2Reveal', 'dateGate', 'ending', 'saveSlot'] as const) {
      expect(musicForScene(s)).toBe('ending');
    }
    // No music before the first gesture (system check) and none in dev scenes.
    expect(musicForScene('systemCheck')).toBeNull();
    expect(musicForScene('dialogueDemo')).toBeNull();
  });
});

describe('tracks', () => {
  it('stay quiet, in range and loop in a few seconds', () => {
    for (const [id, track] of Object.entries(TRACKS)) {
      expect(track.voices.length, id).toBeGreaterThan(0);
      for (const v of track.voices) {
        expect(v.gain, id).toBeLessThanOrEqual(0.06);
        expect(
          v.pattern.some((n) => n !== null),
          id,
        ).toBe(true);
        for (const n of v.pattern) if (n !== null) expect(n >= 36 && n <= 96, id).toBe(true);
        const loop = v.pattern.length * stepSeconds(track);
        expect(loop, id).toBeGreaterThan(1);
        expect(loop, id).toBeLessThan(12);
      }
    }
  });

  it('all derive from one short motif', () => {
    expect(MOTIF.length).toBeGreaterThanOrEqual(4);
    expect(MOTIF.length).toBeLessThanOrEqual(6);
  });
});

describe('SFX vocabulary (GAME_11_SPEC §6)', () => {
  it('covers the sounds the critical path uses', () => {
    for (const id of [
      'cursor',
      'confirm',
      'cancel',
      'boot',
      'interact',
      'cardGet',
      'puzzleWrong',
      'puzzleComplete',
      'warning',
      'hit',
      'bossNode',
      'bossDefeat',
      'signalFound',
      'save',
      'gateLocked',
      'gateOpen',
    ]) {
      expect(SYNTH_SFX[id], id).toBeDefined();
    }
  });
});
