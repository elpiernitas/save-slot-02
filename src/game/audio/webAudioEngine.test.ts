import { describe, expect, it } from 'vitest';
import { SYNTH_SFX, sfxDuration } from './synthSfx';
import { createWebAudioEngine } from './webAudioEngine';

describe('synth SFX', () => {
  it('keeps every UI sound short and quiet', () => {
    for (const [id, notes] of Object.entries(SYNTH_SFX)) {
      expect(notes.length, id).toBeGreaterThan(0);
      expect(sfxDuration(notes), id).toBeLessThanOrEqual(0.4);
      for (const note of notes) {
        expect(note.gain, id).toBeLessThanOrEqual(0.15);
        expect(note.duration, id).toBeGreaterThan(0.01);
      }
    }
  });
});

describe('web audio engine without Web Audio (node)', () => {
  it('stays silent and never throws', async () => {
    const engine = createWebAudioEngine();
    await engine.unlock();
    expect(engine.unlocked).toBe(false);
    expect(() => {
      engine.playSfx('confirm');
      engine.playSfx('unknown-id');
      engine.playVoiceBlip('narrator');
      engine.playMusic('title');
      engine.stopMusic();
    }).not.toThrow();
  });
});
