import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DialogueBox } from '../../dialogue/ui/DialogueBox';
import '../../dialogue/ui/dialogue.css';
import { InputContext } from '../../input/InputContext';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useInput } from '../../input/useInput';
import type { SceneProps } from '../../scenes/types';
import { useGame } from '../../state/useGame';
import { useReducedMotion } from '../../ui/useReducedMotion';
import { loadImage, MANU_SPRITE, PACK_ART } from '../../art/pack';
import { loadSpriteImages, type SpriteImages } from '../../world/art/assets';
import { clearFreshDefeat, isFreshDefeat, revealBeats, STORY_FLAGS } from '../story';
import { ACHIEVEMENT_IDS } from '../../achievements/registry';
import '../desync/desync.css';
import { REVEAL_COPY, skippable } from './beats';
import { advanceGate, createGate, gateLines, switch1InReach, type GateState } from './gate';
import { createGateRenderer } from './render';
import './reveal.css';

const MANU_SPEAKER = {
  speakerId: 'manu',
  name: REVEAL_COPY.speaker,
  tone: 'default' as const,
  portrait: null,
  expression: undefined,
  voice: undefined,
};

let playerArt: Promise<SpriteImages> | null = null;

/**
 * Scene `player2Reveal`: SIGNAL FOUND → PLAYER SLOT 02 → PLAYER 2 — MANU →
 * one human line → PARTY STATUS — 2/2 → cooperative gate → destination data.
 *
 * Identity is typographic until CHAR-003/004 exist: no face is drawn or
 * implied. The boss defeat is already saved; this scene writes
 * `story.player2Found` (party beat) and `story.player2GateComplete` (end).
 */
export function Player2Reveal(_: SceneProps) {
  const { save, dispatch, services } = useGame();
  const router = useContext(InputContext);
  if (!router) throw new Error('Player2Reveal needs <InputProvider>');
  const reduced = useReducedMotion();

  const [beats] = useState(() => revealBeats(save, isFreshDefeat()));
  const [index, setIndex] = useState(0);
  const beat = beats[Math.min(index, beats.length - 1)]!;
  const [lines, setLines] = useState(() => gateLines(createGate()));
  const [prompt, setPrompt] = useState(false);
  const [images, setImages] = useState<SpriteImages | null>(null);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, beats.length - 1)), [beats]);

  useEffect(() => {
    let alive = true;
    (playerArt ??= Promise.all([
      loadSpriteImages(['player']),
      loadImage(PACK_ART.seafront),
      loadImage(MANU_SPRITE.url),
    ]).then(
      ([sprites, seafront, manu]) => new Map([...sprites, ['seafront', seafront], ['manu', manu]]),
    )).then(
      (loaded) => alive && setImages(loaded),
      (error: unknown) => console.error('Reveal art failed to load', error),
    );
    return () => {
      alive = false;
    };
  }, []);

  // Timed beats advance by themselves.
  useEffect(() => {
    if (beat.ms === null || beat.id === 'end') return;
    const id = window.setTimeout(next, beat.ms);
    return () => window.clearTimeout(id);
  }, [beat, next]);

  // Save writes happen on reaching a beat, so skipping never skips them.
  useEffect(() => {
    if (beat.id === 'found') services.audio.playSfx('signalFound');
    if (beat.id === 'party') {
      services.audio.playSfx('boot');
      dispatch({ type: 'flag/set', flag: STORY_FLAGS.player2Found, value: true });
      clearFreshDefeat();
    }
    if (beat.id === 'end') {
      dispatch({ type: 'achievement/unlock', achievement: ACHIEVEMENT_IDS.playerTwoOnline });
      dispatch({ type: 'flag/set', flag: STORY_FLAGS.player2GateComplete, value: true });
    }
  }, [beat, dispatch, services.audio]);

  // End: hand over to GAME-08's scene (not implemented here).
  useEffect(() => {
    if (beat.id !== 'end') return;
    const id = window.setTimeout(
      () => dispatch({ type: 'scene/goTo', scene: 'dateGate' }),
      beat.ms ?? 0,
    );
    return () => window.clearTimeout(id);
  }, [beat, dispatch]);

  // Cooperative gate loop.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gateRef = useRef<GateState>(createGate());
  const interactRef = useRef(false);
  const live = useRef({ reduced, beat });
  useLayoutEffect(() => {
    live.current = { reduced, beat };
  });
  const onGateOpen = useRef(next);
  useLayoutEffect(() => {
    onGateOpen.current = next;
  });

  const showGate = beat.id === 'gate' || beat.id === 'end';
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!showGate || !canvas) return;
    const renderer = createGateRenderer(canvas, images);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) renderer.resize(entry.contentRect.height * window.devicePixelRatio);
    });
    observer.observe(canvas);
    let raf = 0;
    let last = performance.now();
    let walked = 0;
    const frame = (now: number) => {
      const dt = now - last;
      last = now;
      const prev = gateRef.current;
      if (live.current.beat.id === 'gate') {
        const s = advanceGate(prev, dt, {
          dir: router.heldDirection(),
          interact: interactRef.current,
          reduced: live.current.reduced,
        });
        interactRef.current = false;
        const moved = Math.hypot(s.p1.x - prev.p1.x, s.p1.y - prev.p1.y);
        walked = moved > 0 ? walked + moved : 0;
        if (s.stage !== prev.stage) {
          services.audio.playSfx(s.stage === 'open' ? 'gateOpen' : 'interact');
          setLines(gateLines(s));
          if (s.stage === 'open') onGateOpen.current();
        }
        setPrompt(switch1InReach(s));
        gateRef.current = s;
      }
      renderer.draw(gateRef.current, walked, live.current.reduced);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [showGate, images, router, services.audio]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __reveal?: unknown };
    w.__reveal = { gate: () => gateRef.current, beat: () => live.current.beat.id };
    return () => {
      delete w.__reveal;
    };
  }, []);

  useInput(
    (input, { repeat }) => {
      if (input !== 'confirm' || repeat) return;
      if (beat.id === 'gate') interactRef.current = true;
      else if (skippable(beat) && beat.id !== 'end') next();
    },
    { priority: INPUT_PRIORITY.scene },
  );

  const slotShown = beat.id === 'slot' || beat.id === 'name';
  return (
    <div className="reveal" aria-label="PLAYER SLOT 02">
      {showGate && <canvas ref={canvasRef} className="desync__canvas" aria-hidden="true" />}

      {(beat.id === 'scan' || beat.id === 'found') && (
        <div className="desync__card" onClick={next}>
          <p>{beat.id === 'scan' ? REVEAL_COPY.scan : REVEAL_COPY.found}</p>
        </div>
      )}

      {slotShown && (
        <div className="reveal__field" onClick={next}>
          <section className="reveal__slot" data-resolved={beat.id === 'name' ? '' : undefined}>
            <header className="reveal__slot-head">
              <span>{REVEAL_COPY.slot}</span>
              <span className="reveal__slot-status">{REVEAL_COPY.recovered}</span>
            </header>
            <div className="reveal__slot-body">
              {/* The slot stays empty until the name resolves; then his face loads. */}
              <div className="reveal__frame" aria-hidden="true">
                {beat.id === 'name' ? (
                  <img src={PACK_ART.manuPortrait} alt="" draggable={false} />
                ) : (
                  <span>02</span>
                )}
              </div>
              <div className="reveal__id">
                <span className="reveal__label">PLAYER 2</span>
                <span className="reveal__name">{beat.id === 'name' ? 'MANU' : '— — — —'}</span>
              </div>
            </div>
          </section>
          {beat.id === 'name' && <p className="reveal__caption">{REVEAL_COPY.name}</p>}
        </div>
      )}

      {beat.id === 'line' && (
        <div className="reveal__field" onClick={next}>
          <p className="reveal__caption">{REVEAL_COPY.name}</p>
          <div className="dlg-layer">
            <DialogueBox speaker={MANU_SPEAKER} waiting onClick={next}>
              {REVEAL_COPY.line}
            </DialogueBox>
          </div>
        </div>
      )}

      {beat.id === 'party' && (
        <div className="desync__card" onClick={next}>
          <p>{REVEAL_COPY.link}</p>
          <p className="reveal__party">{REVEAL_COPY.party}</p>
        </div>
      )}

      {beat.id === 'gate' && (
        <>
          <div className="reveal__gate-hud" role="status">
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          {prompt && <div className="reveal__gate-prompt">E — LISTO</div>}
        </>
      )}

      {beat.id === 'end' && (
        <div className="reveal__end" role="status">
          <p>{REVEAL_COPY.endA}</p>
          <p className="reveal__end-b">{REVEAL_COPY.endB}</p>
        </div>
      )}
    </div>
  );
}
