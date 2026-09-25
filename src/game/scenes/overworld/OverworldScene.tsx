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
import { checkpointFor, spawnForCheckpoint } from '../../world/checkpoint';
import { worldViewFromQuery } from '../../world/config';
import { WorldEngine } from '../../world/engine/WorldEngine';
import { MURALLA_MAP } from '../../world/maps/muralla';
import { createWorldRenderer } from '../../world/render/canvasRenderer';
import { scriptForInteractable } from '../../world/scripts';
import type { Interactable } from '../../world/types';
import type { SceneProps } from '../types';
import './OverworldScene.css';

/** Keeps the key that closed a dialogue from re-opening it at once. */
const RESUME_COOLDOWN_MS = 250;

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);
  const [target, setTarget] = useState<Interactable | null>(null);
  const [dialogue, setDialogue] = useState<{ script: DialogueScript; key: number } | null>(() =>
    save.flags[MURALLA_FLAGS.arrived] ? null : { script: MURALLA_ARRIVAL, key: 0 },
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [spawn] = useState(() => spawnForCheckpoint(map, save.progress.checkpoint));

  // Latest values for the long-lived engine/input callbacks.
  const live = useRef({ dialogue, menuOpen, reduced });
  useLayoutEffect(() => {
    live.current = { dialogue, menuOpen, reduced };
  });

  const openDialogue = (script: DialogueScript) => {
    engineRef.current?.setPaused(true);
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
    if (!canvas) return;
    const view = worldViewFromQuery(window.location.search, import.meta.env.DEV);
    const renderer = createWorldRenderer(canvas, map, view, {
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
      onRender: (snapshot) => renderer.draw(snapshot),
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
  }, [router, dispatch, map, spawn]);

  const showPrompt = target && !dialogue && !menuOpen;

  return (
    <div className="scene overworld">
      <canvas ref={canvasRef} className="overworld__canvas" aria-label={map.displayName} />
      <div className="overworld__hud" aria-hidden="true">
        <span>
          {map.displayName} · {TIME_LABEL[map.timeOfDay]}
        </span>
      </div>
      {!dialogue && !menuOpen && (
        <footer className="overworld__hints key-hints">
          <span>
            <kbd>WASD</kbd>
            <kbd>↑↓←→</kbd>MOVE
          </span>
          <span>
            <kbd>ESC</kbd>MENU
          </span>
        </footer>
      )}
      {showPrompt && (
        <div className="overworld__prompt" role="status">
          <kbd>E</kbd> / <kbd>ENTER</kbd> — INTERACT
        </div>
      )}
      {dialogue && (
        <DialoguePlayer key={dialogue.key} script={dialogue.script} onFinish={closeDialogue} />
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
