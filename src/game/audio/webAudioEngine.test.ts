import { describe, expect, it } from 'vitest';
import { SYNTH_SFX, sfxDuration, VOICE_BLIPS, voiceNote } from './synthSfx';
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

describe('voice blips', () => {
  it('gives each voice its own short note and falls back to default', () => {
    const pitches = new Set(Object.values(VOICE_BLIPS).map((n) => n.frequency));
    expect(pitches.size).toBe(Object.keys(VOICE_BLIPS).length);
    for (const note of Object.values(VOICE_BLIPS)) expect(note.duration).toBeLessThan(0.05);
    expect(voiceNote('unknown-voice', 0)).toEqual(VOICE_BLIPS.default);
  });

  it('wobbles pitch deterministically between blips', () => {
    expect(voiceNote('archivist', 1).frequency).not.toBe(voiceNote('archivist', 0).frequency);
    expect(voiceNote('archivist', 4)).toEqual(voiceNote('archivist', 0));
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
