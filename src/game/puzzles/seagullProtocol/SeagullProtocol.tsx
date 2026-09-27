import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useInput } from '../../input/useInput';
import { createLitCache, drawLitCharacter, GOLDEN_HOUR } from '../../render/compositing';
import { useGame } from '../../state/useGame';
import { useReducedMotion } from '../../ui/useReducedMotion';
import {
  CHARACTER_ROWS,
  loadSpriteImages,
  SPRITES,
  type SpriteImages,
} from '../../world/art/assets';
import {
  advanceSeagull,
  COLS,
  DIVES,
  initialSeagull,
  isDone,
  markedTiles,
  moveSeagull,
  ROWS,
  telegraphMs,
  type Dir,
  type SeagullState,
} from './seagullProtocol';
import './seagullProtocol.css';

const TILE = 56;
const W = COLS * TILE;
const H = ROWS * TILE;
/** La Muralla's own sidewalk and curb (ENV-001), between two bollards: no furniture. */
const PAVING = { x: 397, y: 292, w: 133, h: 80 };
/** The seagull, cut from ENV-001 (east gull occluder art). */
const GULL = { x: 746, y: 321, w: 37, h: 30 };
/** The gull's outline inside that crop, so it flies without its patch of pavement. */
const GULL_OUTLINE: [number, number][] = [
  [2, 5],
  [4, 3],
  [7, 3],
  [9, 6],
  [10, 10],
  [16, 13],
  [22, 16],
  [28, 20],
  [35, 24],
  [35, 27],
  [24, 27],
  [14, 27],
  [6, 26],
  [1, 22],
  [1, 15],
  [2, 10],
];
let gullCutout: HTMLCanvasElement | null = null;

/** Gull cut out of the La Muralla painting along GULL_OUTLINE (built once). */
function gullSprite(full: CanvasImageSource): HTMLCanvasElement {
  if (gullCutout) return gullCutout;
  const c = document.createElement('canvas');
  c.width = GULL.w;
  c.height = GULL.h;
  const g = c.getContext('2d')!;
  g.beginPath();
  GULL_OUTLINE.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.clip();
  g.drawImage(full, GULL.x, GULL.y, GULL.w, GULL.h, 0, 0, GULL.w, GULL.h);
  return (gullCutout = c);
}

/** Failed runs survive leaving the panel (page load only), so the fallback is always reachable. */
let failuresThisVisit = 0;

let art: Promise<SpriteImages> | null = null;

interface SeagullProtocolProps {
  onComplete: (outcome: 'cleared' | 'bored', attempts: number) => void;
  onLeave: () => void;
}

/** PZ-03 panel: world paused underneath, arrows move PLAYER 1 tile to tile. */
export function SeagullProtocol({ onComplete, onLeave }: SeagullProtocolProps) {
  const { services } = useGame();
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [initial] = useState(() => initialSeagull(failuresThisVisit));
  const stateRef = useRef<SeagullState>(initial);
  const [view, setView] = useState<SeagullState>(initial);
  const [images, setImages] = useState<SpriteImages | null>(null);
  const done = useRef(false);
  const complete = useRef(onComplete);
  useLayoutEffect(() => {
    complete.current = onComplete;
  });

  useEffect(() => {
    let alive = true;
    (art ??= loadSpriteImages(['player', 'murallaFull'])).then(
      (loaded) => alive && setImages(loaded),
      (error: unknown) => console.error('Seagull art failed to load', error),
    );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const light = createLitCache(GOLDEN_HOUR);
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const prev = stateRef.current;
      const next = advanceSeagull(prev, now - last);
      last = now;
      if (next !== prev) {
        if (next.phase !== prev.phase) {
          if (next.phase === 'telegraph') services.audio.playSfx('warning');
          if (next.phase === 'strike') services.audio.playSfx('interact');
          if (next.phase === 'hit') services.audio.playSfx('hit');
          if (next.phase === 'cleared') services.audio.playSfx('puzzleComplete');
          if (next.phase === 'bored') services.audio.playSfx('confirm');
          setView(next);
        }
        stateRef.current = next;
        failuresThisVisit = next.failures;
      }
      draw(ctx, stateRef.current, images, light, reduced);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [images, reduced, services.audio]);

  // Development-only handle for automated QA (stripped from production builds).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __seagull?: unknown };
    w.__seagull = { state: () => stateRef.current, marked: () => markedTiles(stateRef.current) };
    return () => {
      delete w.__seagull;
    };
  }, []);

  // Completion: a short beat on the result line, then back to the world.
  useEffect(() => {
    if (!isDone(view) || done.current) return;
    done.current = true;
    const outcome = view.phase === 'cleared' ? 'cleared' : 'bored';
    const id = window.setTimeout(() => {
      failuresThisVisit = 0;
      complete.current(outcome, view.failures + 1);
    }, 1600);
    return () => window.clearTimeout(id);
  }, [view]);

  useInput(
    (input, { repeat }) => {
      if (input === 'cancel' && !repeat && !isDone(stateRef.current)) {
        services.audio.playSfx('cancel');
        onLeave();
        return;
      }
      if (input === 'up' || input === 'down' || input === 'left' || input === 'right') {
        const next = moveSeagull(stateRef.current, input as Dir);
        if (next !== stateRef.current) {
          stateRef.current = next;
          services.audio.playSfx('cursor');
        }
      }
    },
    { priority: INPUT_PRIORITY.panel },
  );

  const survived = view.phase === 'cleared' ? DIVES.length : view.dive;
  return (
    <div className="inv-layer">
      <section className="rpg-box seagull" role="dialog" aria-label="Protocolo de la gaviota">
        <header className="seagull__head">
          <p className="seagull__title">PROTOCOLO DE LA GAVIOTA</p>
          <p className="seagull__count">
            PICADOS ESQUIVADOS {survived}/{DIVES.length}
            {view.assist && <span className="seagull__assist">ASISTIDO</span>}
          </p>
        </header>
        <canvas
          ref={canvasRef}
          className="seagull__canvas"
          width={W * 2}
          height={H * 2}
          aria-hidden="true"
        />
        <div className="seagull__log" aria-live="polite">
          {view.phase === 'ready' && <p>LA SOMBRA AVISA DÓNDE VA A CAER. APÁRTATE.</p>}
          {view.phase === 'telegraph' && <p>SOMBRA DETECTADA — MUÉVETE</p>}
          {(view.phase === 'strike' || view.phase === 'gap') && <p>PICADO FALLIDO. BIEN.</p>}
          {view.phase === 'hit' && (
            <p data-bad>
              PICOTAZO. RACHA REINICIADA
              {view.failures >= 2 && ' — AVISOS MÁS LARGOS'}
            </p>
          )}
          {view.phase === 'cleared' && <p data-ok>PROTOCOLO SUPERADO. LA GAVIOTA SE RETIRA.</p>}
          {view.phase === 'bored' && <p data-ok>LA GAVIOTA PIERDE EL INTERÉS. RUTA LIBRE.</p>}
        </div>
        {!isDone(view) && (
          <footer className="seagull__hints key-hints">
            <span>
              <kbd>↑↓←→</kbd>MOVERSE
            </span>
            <span>
              <kbd>ESC</kbd>SALIR
            </span>
          </footer>
        )}
      </section>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: SeagullState,
  images: SpriteImages | null,
  light: ReturnType<typeof createLitCache>,
  reduced: boolean,
) {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.letterSpacing = '0px';
  const full = images?.get('murallaFull');
  if (full) {
    ctx.drawImage(full, PAVING.x, PAVING.y, PAVING.w, PAVING.h, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#6b5a4a';
    ctx.fillRect(0, 0, W, H);
  }
  // Tile grid in the system language.
  ctx.fillStyle = 'rgb(14 26 44 / 0.28)';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgb(191 238 242 / 0.35)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * TILE + 0.5, 0);
    ctx.lineTo(c * TILE + 0.5, H);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * TILE + 0.5);
    ctx.lineTo(W, r * TILE + 0.5);
    ctx.stroke();
  }

  const marked = markedTiles(s);
  const k = s.phase === 'telegraph' ? Math.min(1, s.t / telegraphMs(s)) : 1;
  // The seagull itself: perched and watching between dives, circling over
  // the grid while its shadow warns, then down on the marked tiles.
  const gull = (x: number, y: number, scale = 1, flip = false) => {
    if (!full) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -scale : scale, scale);
    ctx.drawImage(gullSprite(full), -GULL.w / 2, -GULL.h / 2);
    ctx.restore();
  };
  if (s.phase === 'ready' || s.phase === 'gap' || s.phase === 'hit') gull(W - 26, 20, 0.9, true);
  if (s.phase === 'telegraph' && marked.length) {
    const cx = (marked.reduce((a, [c]) => a + c, 0) / marked.length) * TILE + TILE / 2;
    const cy = (marked.reduce((a, [, r]) => a + r, 0) / marked.length) * TILE + TILE / 2;
    // Circles high above, drops towards the target as the warning fills.
    const sway = reduced ? 0 : Math.sin(s.t / 160) * 18;
    gull(cx + sway * (1 - k), 14 + (cy - 30) * k * k, 0.8 + 0.4 * k, sway < 0);
  }
  for (const [c, r] of marked) {
    const x = c * TILE;
    const y = r * TILE;
    if (s.phase === 'telegraph') {
      // Shadow grows as the dive approaches; the dashed edge is always shown.
      const size = reduced ? 0.7 : 0.3 + 0.5 * k;
      ctx.fillStyle = 'rgb(20 12 24 / 0.45)';
      ctx.beginPath();
      ctx.ellipse(
        x + TILE / 2,
        y + TILE / 2 + 6,
        (TILE / 2) * size,
        (TILE / 5) * size,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#f4ecda';
      ctx.strokeRect(x + 2.5, y + 2.5, TILE - 5, TILE - 5);
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = 'rgb(232 115 90 / 0.55)';
      ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      if (full) ctx.drawImage(gullSprite(full), x + 9, y + 12);
    }
  }

  const info = SPRITES.player;
  const img = images?.get('player');
  if (info && img && !(s.phase === 'hit' && !reduced && Math.floor(s.t / 120) % 2 === 0)) {
    const [c, r] = s.pos;
    drawLitCharacter(
      ctx,
      light,
      'player',
      {
        img,
        sx: 0,
        sy: CHARACTER_ROWS.down * info.frameHeight,
        w: info.frameWidth,
        h: info.frameHeight,
      },
      { x: info.anchorX, y: info.anchorY },
      c * TILE + TILE / 2,
      r * TILE + TILE - 4,
    );
  }
  if (s.phase === 'ready' || s.phase === 'gap') {
    ctx.fillStyle = 'rgb(191 238 242 / 0.8)';
    ctx.fillRect(0, H - 3, W * ((s.dive + (s.phase === 'gap' ? 1 : 0)) / DIVES.length), 3);
  }
}
