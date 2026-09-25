import { describe, expect, it } from 'vitest';
import { createSilentAudioEngine } from './silentAudioEngine';
import { DEFAULT_AUDIO_SETTINGS } from './types';

describe('silent audio engine', () => {
  it('ignores music until unlocked by a user gesture', async () => {
    const engine = createSilentAudioEngine();
    engine.playMusic('title');
    expect(engine.currentTrack).toBeNull();
    await engine.unlock();
    engine.playMusic('title');
    expect(engine.currentTrack).toBe('title');
  });

  it('keeps the track while muted so unmuting can resume it', async () => {
    const engine = createSilentAudioEngine();
    await engine.unlock();
    engine.applySettings({ ...DEFAULT_AUDIO_SETTINGS, muted: true });
    engine.playMusic('overworld');
    expect(engine.settings.muted).toBe(true);
    expect(engine.currentTrack).toBe('overworld');
    engine.stopMusic();
    expect(engine.currentTrack).toBeNull();
  });
});
