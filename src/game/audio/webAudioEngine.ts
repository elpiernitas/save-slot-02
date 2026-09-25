import { SYNTH_SFX, type SynthNote } from './synthSfx';
import { DEFAULT_AUDIO_SETTINGS, type AudioEngine, type AudioSettings } from './types';

type AudioContextCtor = new () => AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Web Audio engine. GAME-01 scope: synthesized UI SFX only; music and voice
 * blips from files arrive in GAME-11 behind the same contract.
 *
 * The AudioContext is created inside `unlock()`, which must run from a user
 * gesture (mobile/desktop autoplay policies). Without Web Audio it stays silent.
 */
export function createWebAudioEngine(): AudioEngine {
  let context: AudioContext | null = null;
  let settings: AudioSettings = DEFAULT_AUDIO_SETTINGS;

  function playNotes(notes: readonly SynthNote[], channelVolume: number) {
    if (!context || context.state !== 'running' || settings.muted || channelVolume <= 0) return;
    let start = context.currentTime;
    for (const note of notes) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = note.wave;
      osc.frequency.value = note.frequency;
      const peak = note.gain * channelVolume;
      // Short attack/release to avoid clicks.
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.004);
      gain.gain.setValueAtTime(peak, start + note.duration - 0.01);
      gain.gain.linearRampToValueAtTime(0, start + note.duration);
      osc.connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + note.duration);
      start += note.duration;
    }
  }

  return {
    get unlocked() {
      return context?.state === 'running';
    },
    async unlock() {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return;
      try {
        context ??= new Ctor();
        if (context.state === 'suspended') await context.resume();
      } catch {
        // Autoplay policy refused: stay silent, try again on the next gesture.
      }
    },
    applySettings(next) {
      settings = next;
    },
    playMusic() {
      // No music yet (GAME-11).
    },
    stopMusic() {
      // No music yet (GAME-11).
    },
    playSfx(sfx) {
      const notes = SYNTH_SFX[sfx];
      if (notes) playNotes(notes, settings.volume.sfx);
    },
    playVoiceBlip() {
      const notes = SYNTH_SFX.blip;
      if (notes) playNotes(notes, settings.volume.voice);
    },
  };
}
