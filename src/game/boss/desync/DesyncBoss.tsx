import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { InputContext } from '../../input/InputContext';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useInput } from '../../input/useInput';
import type { PlayerClassId } from '../../player/classes';
import type { SceneProps } from '../../scenes/types';
import { useGame } from '../../state/useGame';
import { Menu } from '../../ui/Menu';
import { useMenu, type MenuItem } from '../../ui/useMenu';
import { useReducedMotion } from '../../ui/useReducedMotion';
import { loadSpriteImages, type SpriteImages } from '../../world/art/assets';
import { markFreshDefeat } from '../story';
import { createDesyncRenderer } from './render';
import {
  advanceBoss,
  ARENA,
  COMMITS_PER_NODE,
  coreInReach,
  createAttempt,
  currentHazard,
  nodeInReach,
  PHASE_NODES,
  type DesyncState,
} from './state';
import './desync.css';

/** Locked intro copy (GAME_07_COPY). Shown once per visit, never on retry. */
const INTRO = [
  'RECOVERY PROCESS ERROR',
  'UNRESOLVED INPUT DETECTED',
  'STARTING DESYNC RECOVERY...',
];
const INTRO_LINE_MS = 1100;
const TITLE_MS = 1400;
const TERMINATED_MS = 2200;
/** Assist is offered after this many failed attempts. */
const ASSIST_AFTER = 2;

/** Phase-start flavour only; difficulty is the same for every class. */
const CLASS_LINE: Readonly<Record<PlayerClassId, string>> = {
  warrior: 'DIRECT ROUTE DETECTED.',
  tank: 'SIGNAL TOLERANCE: HIGH.',
  healer: 'RECOVERY ROUTE MAPPED.',
};

const PHASE_LABEL = {
  checksum: 'CHECKSUM MISMATCH',
  split: 'SIGNAL SPLIT',
  missing: 'MISSING CHANNEL',
} as const;

type Stage =
  | { kind: 'intro'; line: number }
  | { kind: 'title' }
  | { kind: 'fight' }
  | { kind: 'failed' }
  | { kind: 'terminated' };

/** What the DOM HUD shows; updated only when it changes (not every frame). */
interface Hud {
  integrity: number;
  phase: DesyncState['phase'];
  banner: string | null;
  notice: string | null;
  prompt: string | null;
  progress: string;
  phase3: boolean;
}

function hudOf(s: DesyncState): Hud {
  const node = nodeInReach(s);
  const prompt = coreInReach(s) ? 'E — RECOVER INPUT' : node ? 'E — STABILISE' : null;
  const progress = PHASE_NODES[s.phase]
    .map((id) => `${id.toUpperCase()} ${s.nodes[id]}/${COMMITS_PER_NODE}`)
    .join('  ');
  return {
    integrity: s.integrity,
    phase: s.phase,
    banner: s.banner?.text ?? null,
    notice: s.notice?.text ?? null,
    prompt,
    progress,
    phase3: s.phase === 'missing' && !s.banner,
  };
}

const sameHud = (a: Hud, b: Hud) => (Object.keys(a) as (keyof Hud)[]).every((k) => a[k] === b[k]);

let playerArt: Promise<SpriteImages> | null = null;

/**
 * Scene `boss`: DESYNC PROCESS. The scene owns the RAF loop, input, SFX and
 * the save writes (`boss/attempt` once per real attempt, `boss/defeat`
 * before leaving); `state.ts` decides everything else.
 */
export function DesyncBoss(_: SceneProps) {
  const { save, dispatch, services } = useGame();
  const router = useContext(InputContext);
  if (!router) throw new Error('DesyncBoss needs <InputProvider>');
  const reduced = useReducedMotion();

  const [stage, setStage] = useState<Stage>({ kind: 'intro', line: 0 });
  const [assist, setAssist] = useState(false);
  const [assistDeclined, setAssistDeclined] = useState(false);
  /** Failed attempts: this visit's plus earlier page loads' unfinished ones. */
  const [failures, setFailures] = useState(() => save.boss.attempts);
  const [hud, setHud] = useState<Hud>(() => hudOf(createAttempt()));
  const [images, setImages] = useState<SpriteImages | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<DesyncState>(createAttempt());
  const interactRef = useRef(false);
  const walkedRef = useRef(0);
  const live = useRef({ reduced, stage });
  useLayoutEffect(() => {
    live.current = { reduced, stage };
  });

  useEffect(() => {
    let alive = true;
    (playerArt ??= loadSpriteImages(['player'])).then(
      (loaded) => alive && setImages(loaded),
      (error: unknown) => console.error('Boss art failed to load', error),
    );
    return () => {
      alive = false;
    };
  }, []);

  // Intro and title cards advance on their own (Enter/click skip ahead).
  const advanceIntro = useCallback(() => {
    setStage((st) =>
      st.kind === 'intro'
        ? st.line + 1 < INTRO.length
          ? { kind: 'intro', line: st.line + 1 }
          : { kind: 'title' }
        : st.kind === 'title'
          ? { kind: 'fight' }
          : st,
    );
  }, []);
  useEffect(() => {
    if (stage.kind !== 'intro' && stage.kind !== 'title') return;
    const id = window.setTimeout(advanceIntro, stage.kind === 'title' ? TITLE_MS : INTRO_LINE_MS);
    return () => window.clearTimeout(id);
  }, [stage, advanceIntro]);

  // One `boss/attempt` per real attempt: when a fresh fight starts.
  const fightKey = useRef(0);
  const [attemptKey, setAttemptKey] = useState(0);
  useEffect(() => {
    if (stage.kind !== 'fight' || fightKey.current === attemptKey + 1) return;
    fightKey.current = attemptKey + 1;
    dispatch({ type: 'boss/attempt' });
  }, [stage, attemptKey, dispatch]);

  const onComplete = useCallback(() => {
    // Persist the defeat before anything else: a refresh from here on
    // routes to the reveal and never replays the boss.
    dispatch({ type: 'boss/defeat' });
    markFreshDefeat();
    services.audio.playSfx('boot');
    setStage({ kind: 'terminated' });
  }, [dispatch, services.audio]);

  useEffect(() => {
    if (stage.kind !== 'terminated') return;
    const id = window.setTimeout(
      () => dispatch({ type: 'scene/goTo', scene: 'player2Reveal' }),
      TERMINATED_MS,
    );
    return () => window.clearTimeout(id);
  }, [stage, dispatch]);

  // Game loop: runs only while fighting.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createDesyncRenderer(canvas, images);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) renderer.resize(entry.contentRect.height * window.devicePixelRatio);
    });
    observer.observe(canvas);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = now - last;
      last = now;
      const fighting = live.current.stage.kind === 'fight';
      if (fighting) {
        const prev = stateRef.current;
        const dir = router.heldDirection();
        const next = advanceBoss(prev, dt, { dir, interact: interactRef.current });
        interactRef.current = false;
        walkedRef.current =
          next.player.x !== prev.player.x || next.player.y !== prev.player.y
            ? walkedRef.current +
              Math.hypot(next.player.x - prev.player.x, next.player.y - prev.player.y)
            : 0;
        if (next.integrity < prev.integrity) services.audio.playSfx('cancel');
        if (next.nodes !== prev.nodes) services.audio.playSfx('confirm');
        if (next.banner && next.banner !== prev.banner) services.audio.playSfx('cursor');
        stateRef.current = next;
        const h = hudOf(next);
        setHud((cur) => (sameHud(cur, h) ? cur : h));
        if (next.status === 'failed') {
          services.audio.playSfx('cancel');
          setFailures((n) => n + 1);
          setStage({ kind: 'failed' });
        } else if (next.status === 'complete') {
          onComplete();
        }
      }
      const s = stateRef.current;
      if (promptRef.current) {
        promptRef.current.style.left = `${(s.player.x / ARENA.w) * 100}%`;
        promptRef.current.style.top = `${((s.player.y - 66) / ARENA.h) * 100}%`;
      }
      renderer.draw(s, walkedRef.current, live.current.reduced);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [images, router, services.audio, onComplete]);

  // Dev-only hook for browser QA (same idea as window.__worldEngine).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __desync?: unknown };
    w.__desync = {
      state: () => stateRef.current,
      hazard: () => currentHazard(stateRef.current),
      stage: () => live.current.stage,
    };
    return () => {
      delete w.__desync;
    };
  }, []);

  useInput(
    (input, { repeat }) => {
      if (input !== 'confirm' || repeat) return;
      if (stage.kind === 'intro' || stage.kind === 'title') advanceIntro();
      else if (stage.kind === 'fight') interactRef.current = true;
    },
    { priority: INPUT_PRIORITY.scene },
  );

  const retry = (withAssist: boolean) => {
    stateRef.current = createAttempt({ assist: withAssist });
    walkedRef.current = 0;
    setHud(hudOf(stateRef.current));
    setAttemptKey((k) => k + 1);
    setStage({ kind: 'fight' });
  };

  const openFailed = stage.kind === 'failed';
  const offerAssist = openFailed && failures >= ASSIST_AFTER && !assist && !assistDeclined;

  const phaseStart =
    hud.banner !== null && Object.values(PHASE_LABEL).includes(hud.banner as never);
  const classLine = save.player.classId && phaseStart ? CLASS_LINE[save.player.classId] : null;

  return (
    <div className="desync" aria-label="DESYNC PROCESS">
      <canvas ref={canvasRef} className="desync__canvas" aria-hidden="true" />

      {(stage.kind === 'fight' || stage.kind === 'failed') && (
        <>
          <div className="desync__hud" role="status">
            <span className="desync__signal">
              SIGNAL {hud.integrity}/3
              <span className="desync__pips" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <i key={i} data-on={i < hud.integrity ? '' : undefined} />
                ))}
              </span>
            </span>
            <span className="desync__phase">{PHASE_LABEL[hud.phase]}</span>
            {hud.progress && <span className="desync__progress">{hud.progress}</span>}
            {assist && <span className="desync__assist">ASSIST</span>}
          </div>
          {hud.phase3 && (
            <div className="desync__players">
              <span>PLAYER 1 — ACTIVE</span>
              <span data-missing="">PLAYER 2 — NO SIGNAL</span>
            </div>
          )}
          {hud.banner && (
            <div className="desync__banner" role="status">
              <p>{hud.banner}</p>
              {classLine && <p className="desync__microline">{classLine}</p>}
            </div>
          )}
          {hud.notice && !hud.banner && <div className="desync__notice">{hud.notice}</div>}
        </>
      )}
      <div
        ref={promptRef}
        className="desync__prompt"
        hidden={stage.kind !== 'fight' || !hud.prompt}
      >
        {hud.prompt}
      </div>

      {(stage.kind === 'intro' || stage.kind === 'title') && (
        <div className="desync__card" onClick={advanceIntro}>
          {stage.kind === 'intro' ? (
            INTRO.slice(0, stage.line + 1).map((line) => <p key={line}>{line}</p>)
          ) : (
            <p className="desync__title">DESYNC PROCESS</p>
          )}
        </div>
      )}

      {stage.kind === 'terminated' && (
        <div className="desync__card">
          <p className="desync__title">DESYNC PROCESS — TERMINATED</p>
        </div>
      )}

      {openFailed &&
        (offerAssist ? (
          <AssistPanel
            onEnable={() => {
              setAssist(true);
              retry(true);
            }}
            onDecline={() => setAssistDeclined(true)}
          />
        ) : (
          <FailedPanel
            onRetry={() => retry(assist)}
            onTitle={() => dispatch({ type: 'scene/goTo', scene: 'title' })}
          />
        ))}
    </div>
  );
}

const FAILED_ITEMS: readonly MenuItem[] = [
  { id: 'retry', label: 'RETRY' },
  { id: 'title', label: 'RETURN TO TITLE' },
];

function FailedPanel({ onRetry, onTitle }: { onRetry: () => void; onTitle: () => void }) {
  const menu = useMenu({
    items: FAILED_ITEMS,
    priority: INPUT_PRIORITY.panel,
    onConfirm: (item) => (item.id === 'title' ? onTitle() : onRetry()),
  });
  return (
    <div className="desync__layer">
      <section className="rpg-box desync__panel" role="dialog" aria-label="SIGNAL LOST">
        <h2 className="desync__panel-title">SIGNAL LOST</h2>
        <Menu
          label="SIGNAL LOST"
          items={FAILED_ITEMS}
          selected={menu.selected}
          onHover={menu.select}
          onConfirm={menu.confirm}
        />
      </section>
    </div>
  );
}

const ASSIST_ITEMS: readonly MenuItem[] = [
  { id: 'enable', label: 'ENABLE' },
  { id: 'later', label: 'NOT NOW' },
];

function AssistPanel({ onEnable, onDecline }: { onEnable: () => void; onDecline: () => void }) {
  const menu = useMenu({
    items: ASSIST_ITEMS,
    priority: INPUT_PRIORITY.panel,
    onConfirm: (item) => (item.id === 'enable' ? onEnable() : onDecline()),
    onCancel: onDecline,
  });
  return (
    <div className="desync__layer">
      <section className="rpg-box desync__panel" role="dialog" aria-label="ASSIST MODE AVAILABLE">
        <h2 className="desync__panel-title">SIGNAL LOST</h2>
        <p className="desync__panel-sub">ASSIST MODE AVAILABLE</p>
        <p className="desync__panel-note">Longer warnings. Same result.</p>
        <Menu
          label="ASSIST MODE AVAILABLE"
          items={ASSIST_ITEMS}
          selected={menu.selected}
          onHover={menu.select}
          onConfirm={menu.confirm}
        />
      </section>
    </div>
  );
}
