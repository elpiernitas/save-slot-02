import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MURALLA_ARRIVAL, MURALLA_FLAGS } from '../../content/dialogue/muralla';
import type { DialogueScript } from '../../dialogue/types';
import { DialoguePlayer } from '../../dialogue/ui/DialoguePlayer';
import { InputContext } from '../../input/InputContext';
import { INPUT_PRIORITY, type InputHandler } from '../../input/inputRouter';
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

const TIME_LABEL = { morning: 'MAÑANA', afternoon: 'TARDE', sunset: 'ATARDECER', night: 'NOCHE' };

/**
 * React adapter for the exploration subsystem. React owns the save,
 * dialogue and UI; the WorldEngine owns only position/animation and reports
 * interactions and zone changes through callbacks.
 */
export function OverworldScene(_: SceneProps) {
  const { save, dispatch } = useGame();
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
  const [dialogue, setDialogue] = useState<{ script: DialogueScript; key: number } | null>(() =>
    save.flags[MURALLA_FLAGS.arrived] ? null : { script: MURALLA_ARRIVAL, key: 0 },
  );
  const [menuOpen, setMenuOpen] = useState(false);
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
  const live = useRef({ dialogue, menuOpen, reduced });
  useLayoutEffect(() => {
    live.current = { dialogue, menuOpen, reduced };
  });

  const openDialogue = (script: DialogueScript) => {
    engineRef.current?.setPaused(true);
    // Lower-third box would cover PLAYER 1: move it to the top instead.
    setDialogueAtTop(playerScreenYRef.current > DIALOGUE_FLIP_Y);
    setDialogue((d) => ({ script, key: (d?.key ?? 0) + 1 }));
  };
  const closeDialogue = () => {
    setDialogue(null);
    engineRef.current?.setPaused(false, performance.now(), RESUME_COOLDOWN_MS);
  };
  const setMenu = (open: boolean) => {
    setMenuOpen(open);
    engineRef.current?.setPaused(open, performance.now(), open ? 0 : RESUME_COOLDOWN_MS);
  };
  const actions = useRef({ openDialogue, setMenu });
  useLayoutEffect(() => {
    actions.current = { openDialogue, setMenu };
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
        const script = found && scriptForInteractable(found);
        if (script) actions.current.openDialogue(script);
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
    if (live.current.dialogue || live.current.menuOpen) engine.setPaused(true);
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

  const showPrompt = target && !dialogue && !menuOpen;

  return (
    <div className="scene overworld">
      <canvas ref={canvasRef} className="overworld__canvas" aria-label={map.displayName} />
      <div className="overworld__hud" aria-hidden="true">
        <span>{map.displayName}</span>
        <span className="overworld__hud-time">{TIME_LABEL[map.timeOfDay]}</span>
      </div>
      {!dialogue && !menuOpen && (
        <footer className="overworld__hints key-hints" data-faded={hasMoved || undefined}>
          <span>
            <kbd>WASD</kbd>
            <kbd>↑↓←→</kbd>MOVE
          </span>
          <span>
            <kbd>ESC</kbd>MENU
          </span>
        </footer>
      )}
      <div ref={promptRef} className="overworld__prompt" role="status" hidden={!showPrompt}>
        <kbd>E</kbd> INTERACT
      </div>
      {dialogue && (
        <DialoguePlayer
          key={dialogue.key}
          script={dialogue.script}
          onFinish={closeDialogue}
          placement={dialogueAtTop ? 'top' : 'bottom'}
        />
      )}
      {menuOpen && (
        <PauseMenu
          onResume={() => setMenu(false)}
          onTitle={() => dispatch({ type: 'scene/goTo', scene: 'title' })}
        />
      )}
    </div>
  );
}

function PauseMenu({ onResume, onTitle }: { onResume: () => void; onTitle: () => void }) {
  const items = [
    { id: 'resume', label: 'CONTINUAR' },
    { id: 'title', label: 'VOLVER AL TÍTULO' },
  ];
  const menu = useMenu({
    items,
    priority: INPUT_PRIORITY.panel,
    onConfirm: (item) => (item.id === 'title' ? onTitle() : onResume()),
    onCancel: onResume,
  });
  return (
    <div className="overworld__menu-layer">
      <section className="rpg-box overworld__menu" role="dialog" aria-label="Pausa">
        <p className="overworld__menu-title">PAUSE</p>
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
