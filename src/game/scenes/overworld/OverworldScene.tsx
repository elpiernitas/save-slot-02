import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MURALLA_ARRIVAL, MURALLA_FLAGS } from '../../content/dialogue/muralla';
import {
  BEACON_REJECTED,
  beaconSynced,
  ROUTE_FLAGS,
  ROUTE_NODE,
  ROUTE_ROUND_DONE,
  ROUTE_SOLVED,
  ROUTE_UPDATE,
  RECAL_DONE,
  RECAL_START,
  SEAGULL_ALERT,
  SEAGULL_HINT,
  SEAGULL_INTRO,
  seagullDone,
  SERVICE_ACCESS,
  SERVICE_ACCESS_DONE,
  SERVICE_BLOCKED,
} from '../../content/dialogue/route';
import { ChapterCard, ChapterHud } from '../../progress/ChapterCard';
import {
  chapterCardDue,
  chapterCardToShow,
  chapterLevel,
  chapterSeenFlag,
  type Level,
} from '../../progress/chapters';
import { SeagullProtocol } from '../../puzzles/seagullProtocol/SeagullProtocol';
import type { DialogueScript } from '../../dialogue/types';
import { newAcquisitions, type Acquisition } from '../../inventory/cards';
import { AcquisitionOverlay } from '../../inventory/ui/AcquisitionOverlay';
import { CardBinder } from '../../inventory/ui/CardBinder';
import { InventoryPanel } from '../../inventory/ui/InventoryPanel';
import { DialoguePlayer } from '../../dialogue/ui/DialoguePlayer';
import { InputContext } from '../../input/InputContext';
import { INPUT_PRIORITY, type InputHandler } from '../../input/inputRouter';
import type { GameSave } from '../../state/types';
import {
  BEACONS_ID,
  chapterInteraction,
  chapterStep,
  routeUpdateDue,
  SEAGULL_ID,
  TERMINAL_ID,
  RECAL_ID,
} from '../../puzzles/chapter';
import { BeaconIcon } from '../../puzzles/routeBeacons/BeaconIcon';
import {
  activateBeacon,
  initialBeacons,
  RECAL_ROUNDS,
  type BeaconSymbol,
} from '../../puzzles/routeBeacons/routeBeacons';
import { RouteHud } from '../../puzzles/routeBeacons/RouteHud';
import { RoutePulse } from '../../puzzles/routeBeacons/RoutePulse';
import { SyncTerminal } from '../../puzzles/syncTerminal/SyncTerminal';
import { useGame } from '../../state/useGame';
import { Menu } from '../../ui/Menu';
import { useMenu } from '../../ui/useMenu';
import { useReducedMotion } from '../../ui/useReducedMotion';
import { loadSpriteImages, type SpriteImages } from '../../world/art/assets';
import { cameraFor } from '../../world/camera';
import { checkpointFor, spawnForCheckpoint } from '../../world/checkpoint';
import { worldViewFromQuery } from '../../world/config';
import { WorldEngine } from '../../world/engine/WorldEngine';
import { MURALLA_MAP } from '../../world/maps/muralla';
import { createWorldRenderer } from '../../world/render/canvasRenderer';
import { scriptForInteractable } from '../../world/scripts';
import { TILE_SIZE, type Interactable } from '../../world/types';
import type { SceneProps } from '../types';
import './OverworldScene.css';

/** Prompt sits beside PLAYER 1's head (never over the thing being faced). */
const PROMPT_LIFT = 44;
const PROMPT_SIDE = 22;

/** Feet below this fraction of the view → the dialogue box goes to the top. */
const DIALOGUE_FLIP_Y = 0.62;

/** Keeps the key that closed a dialogue from re-opening it at once. */
const RESUME_COOLDOWN_MS = 250;

/** World art is loaded once per session and shared by every mount. */
let spriteImages: Promise<SpriteImages> | null = null;
const loadWorldArt = () => (spriteImages ??= loadSpriteImages());

/** Where the beacon symbol tags float (world px, above each painted object). */
const BEACON_MARKS: ReadonlyArray<{ symbol: BeaconSymbol; x: number; y: number }> = [
  { symbol: 'cup', x: 128, y: 194 },
  { symbol: 'lamp', x: 199, y: 172 },
  { symbol: 'bird', x: 167, y: 284 },
];

const TIME_LABEL = { morning: 'MAÑANA', afternoon: 'TARDE', sunset: 'ATARDECER', night: 'NOCHE' };

/**
 * React adapter for the exploration subsystem. React owns the save,
 * dialogue and UI; the WorldEngine owns only position/animation and reports
 * interactions and zone changes through callbacks.
 */
export function OverworldScene(_: SceneProps) {
  const { save, dispatch, services } = useGame();
  const router = useContext(InputContext);
  if (!router) throw new Error('OverworldScene needs <InputProvider>');
  const reduced = useReducedMotion();
  const map = MURALLA_MAP;
  const [spawn] = useState(() => spawnForCheckpoint(map, save.progress.checkpoint));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const hasMovedRef = useRef(false);
  /** PLAYER 1's height on screen (0–1), sampled when a dialogue opens. */
  const playerScreenYRef = useRef(0);
  // The arrival text opens before the first frame: place it from the spawn.
  const [dialogueAtTop, setDialogueAtTop] = useState(() => {
    const view = worldViewFromQuery(window.location.search, import.meta.env.DEV);
    const size = { width: map.widthTiles * TILE_SIZE, height: map.heightTiles * TILE_SIZE };
    return (spawn.y - cameraFor(spawn, view, size).y) / view.h > DIALOGUE_FLIP_Y;
  });
  const engineRef = useRef<WorldEngine | null>(null);
  const [target, setTarget] = useState<Interactable | null>(null);
  /** Chapter title card (NIVEL 0N) the first time a level is reached. */
  const [card, setCard] = useState<Level | null>(() => chapterCardToShow(save));
  /** Level whose card was last dismissed: never shown again in this visit (D-087). */
  const closedCardRef = useRef<number | null>(null);
  /** Bumped when a card closes: resume once that close has been committed. */
  const [cardClosed, setCardClosed] = useState(0);
  const [dialogue, setDialogue] = useState<{ script: DialogueScript; key: number } | null>(() =>
    save.flags[MURALLA_FLAGS.arrived] || chapterCardDue(save)
      ? null
      : { script: MURALLA_ARRIVAL, key: 0 },
  );
  /** Pause menu and the GAME-05 panels it opens; the world stays mounted and paused. */
  const [panel, setPanel] = useState<'pause' | 'inventory' | 'cards' | null>(null);
  const menuOpen = panel !== null;
  /** Save as it was when the current dialogue opened (to spot new cards/items). */
  const beforeDialogueRef = useRef<GameSave>(save);
  const [rewardPending, setRewardPending] = useState(false);
  const [rewards, setRewards] = useState<Acquisition[]>([]);
  /** GAME-06 overlays: calibration pattern and SYNC TERMINAL (world paused). */
  const [overlay, setOverlay] = useState<'pulse' | 'terminal' | 'seagull' | null>(null);
  /** Route beacons: runtime only; a refresh restarts calibration (completion persists). */
  const [beacons, setBeacons] = useState(() =>
    initialBeacons(chapterStep(save) === 'recalibrating' ? RECAL_ROUNDS : undefined),
  );
  const beaconsRef = useRef(beacons);
  /** What happens once the current dialogue (and its rewards) is over. */
  const nextStepRef = useRef<(() => void) | null>(null);
  const markRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [images, setImages] = useState<SpriteImages | null>(null);

  useEffect(() => {
    let alive = true;
    loadWorldArt().then(
      (loaded) => alive && setImages(loaded),
      (error: unknown) => console.error('World art failed to load', error),
    );
    return () => {
      alive = false;
    };
  }, []);

  // Latest values for the long-lived engine/input callbacks.
  const live = useRef({ dialogue, menuOpen, reduced, save, card });
  useLayoutEffect(() => {
    live.current = { dialogue, menuOpen, reduced, save, card };
  });

  const openDialogue = (script: DialogueScript, then?: () => void) => {
    engineRef.current?.setPaused(true);
    nextStepRef.current = then ?? null;
    beforeDialogueRef.current = live.current.save;
    // Lower-third box would cover PLAYER 1: move it to the top instead.
    setDialogueAtTop(playerScreenYRef.current > DIALOGUE_FLIP_Y);
    setDialogue((d) => ({ script, key: (d?.key ?? 0) + 1 }));
  };
  const closeDialogue = () => {
    setDialogue(null);
    // Next frame the save holds every effect of the dialogue: show what it
    // granted. The world resumes once any reward notice has been dismissed.
    const before = beforeDialogueRef.current;
    setRewardPending(true);
    requestAnimationFrame(() => {
      setRewardPending(false);
      const gained = newAcquisitions(before, live.current.save);
      if (gained.length) setRewards(gained);
      else resume();
    });
  };
  const closeRewards = () => {
    setRewards([]);
    resume();
  };
  /** Runs the queued follow-up, a due chapter card, the route update, or gives the world back. */
  const resume = () => {
    const next = nextStepRef.current;
    nextStepRef.current = null;
    const due = chapterCardToShow(live.current.save, closedCardRef.current);
    if (next) next();
    else if (due) {
      engineRef.current?.setPaused(true);
      setCard(due);
    } else if (routeUpdateDue(live.current.save))
      openDialogue(ROUTE_UPDATE, () => setOverlay('pulse'));
    else engineRef.current?.setPaused(false, performance.now(), RESUME_COOLDOWN_MS);
  };
  const closeCard = () => {
    const shown = live.current.card;
    // Idempotent: ENTER, a click and the card's own timer may all land.
    if (!shown || closedCardRef.current === shown.n) return;
    closedCardRef.current = shown.n;
    setCard(null);
    dispatch({ type: 'flag/set', flag: chapterSeenFlag(shown.n), value: true });
    // First visit: the arrival line follows the NIVEL 01 card.
    if (!live.current.save.flags[MURALLA_FLAGS.arrived]) openDialogue(MURALLA_ARRIVAL);
    // Resume after this close is committed, not on the next animation frame:
    // a timer-driven close may render after that frame, and resume() would
    // then read a save without the seen flag and show the same card again.
    else setCardClosed((n) => n + 1);
  };
  const resumeRef = useRef(resume);
  useLayoutEffect(() => {
    resumeRef.current = resume;
  });
  useEffect(() => {
    if (cardClosed) resumeRef.current();
  }, [cardClosed]);
  const finishSeagull = (outcome: 'cleared' | 'bored', attempts: number) => {
    setOverlay(null);
    dispatch({ type: 'puzzle/complete', puzzle: SEAGULL_ID, attempts });
    dispatch({ type: 'achievement/unlock', achievement: 'signal_found' });
    openDialogue(seagullDone(outcome));
  };
  const closeOverlay = () => {
    setOverlay(null);
    resume();
  };
  const finishTerminal = () => {
    dispatch({ type: 'puzzle/complete', puzzle: TERMINAL_ID, attempts: 1 });
    dispatch({ type: 'flag/set', flag: ROUTE_FLAGS.player2SignalMissing, value: true });
    // D-085: the recovery error scrambles the route; recalibrate it in La
    // Muralla (same beacons, new order), then DESYNC PROCESS (GAME-07).
    setOverlay(null);
    const recal = initialBeacons(RECAL_ROUNDS);
    beaconsRef.current = recal;
    setBeacons(recal);
    openDialogue(RECAL_START, () => setOverlay('pulse'));
  };
  /** World object faced + confirm: chapter logic first, plain dialogue otherwise. */
  const interact = (found: Interactable) => {
    const step = chapterInteraction(found.id, live.current.save);
    switch (step.kind) {
      case 'beacon': {
        const { state, outcome } = activateBeacon(beaconsRef.current, step.symbol);
        beaconsRef.current = state;
        setBeacons(state);
        if (outcome !== 'ignored') {
          services.audio.playSfx(
            outcome === 'solved'
              ? 'puzzleComplete'
              : outcome === 'round'
                ? 'signalFound'
                : outcome === 'rejected'
                  ? 'puzzleWrong'
                  : 'interact',
          );
        }
        if (outcome === 'solved' && chapterStep(live.current.save) === 'recalibrating') {
          dispatch({ type: 'puzzle/complete', puzzle: RECAL_ID, attempts: state.attempts });
          openDialogue(RECAL_DONE, () => dispatch({ type: 'scene/goTo', scene: 'boss' }));
        } else if (outcome === 'solved') {
          dispatch({ type: 'puzzle/complete', puzzle: BEACONS_ID, attempts: state.attempts });
          dispatch({ type: 'achievement/unlock', achievement: 'first_sync' });
          openDialogue(ROUTE_SOLVED, () => openDialogue(SEAGULL_ALERT));
        } else if (outcome === 'round') {
          // Round 1 synced: show the new, longer order right away.
          openDialogue(ROUTE_ROUND_DONE, () => setOverlay('pulse'));
        } else if (outcome === 'rejected') openDialogue(BEACON_REJECTED);
        else if (outcome === 'synced')
          openDialogue(beaconSynced(step.symbol, state.progress, state.sequence.length));
        return;
      }
      case 'routeNode':
        openDialogue(ROUTE_NODE, () => setOverlay('pulse'));
        return;
      case 'seagull':
        openDialogue(SEAGULL_INTRO, () => setOverlay('seagull'));
        return;
      case 'seagullHint':
        openDialogue(SEAGULL_HINT);
        return;
      case 'serviceBlocked':
        openDialogue(SERVICE_BLOCKED);
        return;
      case 'serviceAccess':
        openDialogue(SERVICE_ACCESS, () => setOverlay('terminal'));
        return;
      case 'serviceDone':
        openDialogue(SERVICE_ACCESS_DONE);
        return;
      case 'default': {
        const script = scriptForInteractable(found);
        if (script) openDialogue(script);
      }
    }
  };
  const setMenu = (open: boolean) => {
    setPanel(open ? 'pause' : null);
    engineRef.current?.setPaused(open, performance.now(), open ? 0 : RESUME_COOLDOWN_MS);
  };
  const actions = useRef({ interact, setMenu });
  useLayoutEffect(() => {
    actions.current = { interact, setMenu };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !images) return;
    const view = worldViewFromQuery(window.location.search, import.meta.env.DEV);
    const renderer = createWorldRenderer(canvas, map, view, images, {
      reducedMotion: () => live.current.reduced,
    });

    // World input layer: confirm = interact, cancel = menu. Movement polls
    // held keys, but only while this layer owns input.
    const handler: InputHandler = (input, { repeat }) => {
      if (repeat) return;
      const engine = engineRef.current;
      if (input === 'confirm' && engine) {
        const found = engine.tryInteract(performance.now());
        if (found) actions.current.interact(found);
      } else if (input === 'cancel') {
        actions.current.setMenu(true);
      }
    };
    const removeLayer = router.add(handler, INPUT_PRIORITY.world);

    const engine = new WorldEngine({
      map,
      spawn,
      view,
      input: {
        heldDirection: () => router.heldDirection(),
        isActive: () => router.isTop(handler),
      },
      scheduler: {
        request: (cb) => requestAnimationFrame(cb),
        cancel: (id) => cancelAnimationFrame(id),
      },
      onRender: (snapshot) => {
        renderer.draw(snapshot);
        // Contextual prompt floats above PLAYER 1 (positioned without re-rendering React).
        const prompt = promptRef.current;
        if (prompt) {
          prompt.style.left = `${((snapshot.pos.x - snapshot.camera.x + PROMPT_SIDE) / view.w) * 100}%`;
          prompt.style.top = `${((snapshot.pos.y - snapshot.camera.y - PROMPT_LIFT) / view.h) * 100}%`;
        }
        playerScreenYRef.current = (snapshot.pos.y - snapshot.camera.y) / view.h;
        BEACON_MARKS.forEach((mark, i) => {
          const el = markRefs.current[i];
          if (!el) return;
          el.style.left = `${((mark.x - snapshot.camera.x) / view.w) * 100}%`;
          el.style.top = `${((mark.y - snapshot.camera.y) / view.h) * 100}%`;
        });
        if (snapshot.moving && !hasMovedRef.current) {
          hasMovedRef.current = true;
          setHasMoved(true);
        }
      },
      onTargetChange: setTarget,
      onZoneEnter: (zone) =>
        dispatch({ type: 'progress/checkpoint', checkpoint: checkpointFor(map.id, zone.spawn) }),
    });
    engineRef.current = engine;
    // Development-only handle for automated QA (stripped from production builds).
    if (import.meta.env.DEV) Object.assign(window, { __worldEngine: engine });
    if (live.current.dialogue || live.current.menuOpen || live.current.card) engine.setPaused(true);
    engine.start();

    const observer = new ResizeObserver(([entry]) => {
      if (entry) renderer.resize(entry.contentRect.height * window.devicePixelRatio);
    });
    observer.observe(canvas);

    return () => {
      if (import.meta.env.DEV) Reflect.deleteProperty(window, '__worldEngine');
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
      removeLayer();
      renderer.destroy();
    };
  }, [router, dispatch, map, spawn, images]);

  const busy =
    Boolean(dialogue) ||
    menuOpen ||
    rewards.length > 0 ||
    rewardPending ||
    overlay !== null ||
    card !== null;
  const step = chapterStep(save);
  const calibrating = step === 'calibrating' || step === 'recalibrating';
  // A mark reads as synced only if it is not needed again in this round.
  const remaining = beacons.sequence.slice(beacons.progress);
  const syncedSymbols = beacons.sequence
    .slice(0, beacons.progress)
    .filter((sym) => !remaining.includes(sym));
  const showPrompt = target && !busy;

  return (
    <div className="scene overworld">
      <canvas ref={canvasRef} className="overworld__canvas" aria-label={map.displayName} />
      <div className="overworld__hud" aria-hidden="true">
        <span>{map.displayName}</span>
        <span className="overworld__hud-time">{TIME_LABEL[map.timeOfDay]}</span>
      </div>
      {!busy && (
        <footer className="overworld__hints key-hints" data-faded={hasMoved || undefined}>
          <span>
            <kbd>WASD</kbd>
            <kbd>↑↓←→</kbd>MOVERSE
          </span>
          <span>
            <kbd>ESC</kbd>MENÚ
          </span>
        </footer>
      )}
      {/* Top-left, under the location tag, never over the café's sign; the
          route HUD stacks under the level so the two never overlap. */}
      <div className="overworld__objectives">
        {!card && overlay === null && (
          <ChapterHud level={chapterLevel(save)} compact={calibrating} />
        )}
        {calibrating && <RouteHud state={beacons} recal={step === 'recalibrating'} />}
      </div>
      {calibrating &&
        BEACON_MARKS.map((mark, i) => (
          <div
            key={mark.symbol}
            ref={(el) => {
              markRefs.current[i] = el;
            }}
            className="beacon-mark"
            data-synced={syncedSymbols.includes(mark.symbol) || undefined}
            aria-hidden="true"
          >
            <BeaconIcon symbol={mark.symbol} />
          </div>
        ))}
      <div ref={promptRef} className="overworld__prompt" role="status" hidden={!showPrompt}>
        <kbd>E</kbd> INTERACTUAR
      </div>
      {dialogue && (
        <DialoguePlayer
          key={dialogue.key}
          script={dialogue.script}
          onFinish={closeDialogue}
          placement={dialogueAtTop ? 'top' : 'bottom'}
        />
      )}
      {rewards.length > 0 && <AcquisitionOverlay entries={rewards} onDone={closeRewards} />}
      {overlay === 'pulse' && <RoutePulse sequence={beacons.sequence} onDone={closeOverlay} />}
      {overlay === 'seagull' && (
        <SeagullProtocol onComplete={finishSeagull} onLeave={closeOverlay} />
      )}
      {card && <ChapterCard key={card.n} level={card} onDone={closeCard} />}
      {overlay === 'terminal' && (
        <SyncTerminal onComplete={finishTerminal} onLeave={closeOverlay} />
      )}
      {panel === 'pause' && (
        <PauseMenu
          onResume={() => setMenu(false)}
          onOpen={setPanel}
          onTitle={() => dispatch({ type: 'scene/goTo', scene: 'title' })}
        />
      )}
      {panel === 'inventory' && <InventoryPanel onBack={() => setPanel('pause')} />}
      {panel === 'cards' && <CardBinder onBack={() => setPanel('pause')} />}
    </div>
  );
}

const PAUSE_ITEMS = [
  { id: 'resume', label: 'CONTINUAR' },
  { id: 'inventory', label: 'INVENTARIO' },
  { id: 'cards', label: 'CITY CARDS' },
  { id: 'title', label: 'VOLVER AL TÍTULO' },
];

function PauseMenu({
  onResume,
  onOpen,
  onTitle,
}: {
  onResume: () => void;
  onOpen: (panel: 'inventory' | 'cards') => void;
  onTitle: () => void;
}) {
  const items = PAUSE_ITEMS;
  const menu = useMenu({
    items,
    priority: INPUT_PRIORITY.panel,
    onConfirm: (item) => {
      if (item.id === 'title') onTitle();
      else if (item.id === 'inventory' || item.id === 'cards') onOpen(item.id);
      else onResume();
    },
    onCancel: onResume,
  });
  return (
    <div className="overworld__menu-layer">
      <section className="rpg-box overworld__menu" role="dialog" aria-label="Pausa">
        <p className="overworld__menu-title">PAUSA</p>
        <Menu
          label="Pausa"
          items={items}
          selected={menu.selected}
          onHover={menu.select}
          onConfirm={menu.confirm}
        />
        <p className="overworld__menu-note">El progreso se guarda solo.</p>
      </section>
    </div>
  );
}
