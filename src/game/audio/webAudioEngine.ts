import { midiToHz, stepSeconds, TRACKS, type MusicTrack } from './music';
import { SYNTH_SFX, voiceNote, type SynthNote } from './synthSfx';
import {
  DEFAULT_AUDIO_SETTINGS,
  type AudioEngine,
  type AudioSettings,
  type TrackId,
} from './types';

/** Music scheduler: look this far ahead, wake up this often (no drift from timers). */
const LOOKAHEAD_S = 0.15;
const TICK_MS = 40;
const DEFAULT_FADE_MS = 400;

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
 * Web Audio engine: synthesized SFX, voice blips and (GAME-11) procedural
 * music from `music.ts`, scheduled ahead on the audio clock through one
 * gain node that fades, follows the music volume and mutes.
 *
 * The AudioContext is created inside `unlock()`, which must run from a user
 * gesture (mobile/desktop autoplay policies). Without Web Audio it stays silent.
 */
export function createWebAudioEngine(): AudioEngine {
  let context: AudioContext | null = null;
  let settings: AudioSettings = DEFAULT_AUDIO_SETTINGS;
  let blipCount = 0;

  // Music state. `wanted` survives until unlock (no autoplay before a gesture).
  let wanted: TrackId | null = null;
  let current: {
    id: TrackId;
    track: MusicTrack;
    gain: GainNode;
    step: number;
    next: number;
  } | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  const musicLevel = () => (settings.muted ? 0 : settings.volume.music);

  function schedule() {
    if (!context || !current) return;
    const { track } = current;
    const dur = stepSeconds(track);
    // A throttled tab must not replay a burst of missed steps.
    if (current.next < context.currentTime) current.next = context.currentTime + 0.02;
    while (current.next < context.currentTime + LOOKAHEAD_S) {
      for (const voice of track.voices) {
        const midi = voice.pattern[current.step % voice.pattern.length];
        if (midi == null) continue;
        const osc = context.createOscillator();
        const env = context.createGain();
        const start = current.next;
        const end = start + dur * voice.length;
        osc.type = voice.wave;
        osc.frequency.value = midiToHz(midi);
        env.gain.setValueAtTime(0, start);
        env.gain.linearRampToValueAtTime(voice.gain, start + 0.01);
        env.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(env).connect(current.gain);
        osc.start(start);
        osc.stop(end + 0.02);
      }
      current.step += 1;
      current.next += dur;
    }
  }

  function fadeOutAndDrop(fadeMs: number) {
    if (!context || !current) return;
    const { gain } = current;
    const t = context.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + fadeMs / 1000);
    // Already-scheduled notes end on their own; the node is released after.
    setTimeout(() => gain.disconnect(), fadeMs + 1000);
    current = null;
  }

  function startWanted(fadeMs: number) {
    if (!context || context.state !== 'running' || !wanted) return;
    const track = TRACKS[wanted];
    if (!track) return;
    const gain = context.createGain();
    const t = context.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(musicLevel(), t + fadeMs / 1000);
    gain.connect(context.destination);
    current = { id: wanted, track, gain, step: 0, next: t + 0.05 };
    timer ??= setInterval(schedule, TICK_MS);
    schedule();
  }

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
        if (wanted && !current) startWanted(DEFAULT_FADE_MS);
      } catch {
        // Autoplay policy refused: stay silent, try again on the next gesture.
      }
    },
    applySettings(next) {
      settings = next;
      if (context && current) {
        const t = context.currentTime;
        current.gain.gain.cancelScheduledValues(t);
        current.gain.gain.setTargetAtTime(musicLevel(), t, 0.05);
      }
    },
    playMusic(track, options) {
      if (current?.id === track) return;
      wanted = track;
      const fadeMs = options?.fadeMs ?? DEFAULT_FADE_MS;
      fadeOutAndDrop(fadeMs);
      startWanted(fadeMs);
    },
    stopMusic(options) {
      wanted = null;
      fadeOutAndDrop(options?.fadeMs ?? DEFAULT_FADE_MS);
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    playSfx(sfx) {
      const notes = SYNTH_SFX[sfx];
      if (notes) playNotes(notes, settings.volume.sfx);
    },
    playVoiceBlip(voice) {
      playNotes([voiceNote(voice, blipCount++)], settings.volume.voice);
    },
  };
}
