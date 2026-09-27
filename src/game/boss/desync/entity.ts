/**
 * DESYNC PROCESS made visible (production audit): the boss is a broken
 * synchronisation process, drawn as system geometry around the core — never
 * a creature, a face or horror. It only READS the fight state:
 *
 *  - body: nested, misaligned frames (duplicated in coral/cyan when unstable)
 *    around the core, with orbiting fragments of UI windows;
 *  - cables to the three nodes: jagged coral while unstable, straight cyan
 *    once that node is stabilised (committed);
 *  - attacks: every announced hazard is tethered to the body, so it is clear
 *    where the danger comes from;
 *  - damage: each commit flashes the body and knocks a fragment loose; the
 *    jitter and the coral share shrink as the process is stabilised;
 *  - end: `collapse` 0→1 straightens every line, pulls the fragments in and
 *    fades the body, exposing the lost channel.
 */
import {
  COMMITS_PER_NODE,
  CORE,
  NODES,
  type DesyncState,
  type HazardView,
  type NodeId,
} from './state';

const IDS: readonly NodeId[] = ['a', 'b', 'c'];
const TOTAL = IDS.length * COMMITS_PER_NODE;

/** 0 = fully desynced, 1 = every node stabilised. */
export function stability(s: DesyncState): number {
  return IDS.reduce((sum, id) => sum + Math.min(s.nodes[id], COMMITS_PER_NODE), 0) / TOTAL;
}

/** Tiny deterministic noise (no Math.random: frames stay reproducible). */
const noise = (i: number, t: number) =>
  Math.sin(i * 12.9898 + t * 0.0137) * Math.cos(i * 4.1414 + t * 0.0071);

export function createEntity() {
  let lastCommits = -1;
  let flashUntil = 0;
  const loose: { angle: number; born: number }[] = [];

  return function drawEntity(
    ctx: CanvasRenderingContext2D,
    s: DesyncState,
    view: HazardView | null,
    reduced: boolean,
    collapse: number,
  ) {
    const k = stability(s);
    const commits = Math.round(k * TOTAL);
    if (lastCommits >= 0 && commits > lastCommits) {
      flashUntil = s.t + 420;
      loose.push({ angle: commits * 2.4, born: s.t });
    }
    lastCommits = commits;
    const t = reduced ? 0 : s.t;
    const alive = 1 - collapse;
    const jitter = reduced ? 0 : (1 - k) * 3 * alive;
    const hit = s.t < flashUntil;
    const { x: cx, y: cy } = CORE;

    ctx.save();
    ctx.lineCap = 'square';

    // Cables core → nodes.
    for (const id of IDS) {
      const n = NODES[id];
      const done = s.nodes[id] >= COMMITS_PER_NODE;
      const steady = done || collapse > 0;
      ctx.strokeStyle = steady ? 'rgb(191 238 242 / 0.75)' : 'rgb(232 115 90 / 0.7)';
      ctx.lineWidth = steady ? 1 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const segs = 7;
      for (let i = 1; i <= segs; i++) {
        const f = i / segs;
        const off = steady || i === segs ? 0 : noise(i + id.charCodeAt(0), t) * 7 * (1 - k);
        ctx.lineTo(cx + (n.x - cx) * f + off, cy + (n.y - cy) * f - off);
      }
      ctx.stroke();
    }

    // Attacks come out of the process: tether every announced danger zone.
    if (view && view.stage === 'telegraph' && alive > 0) {
      ctx.strokeStyle = 'rgb(232 115 90 / 0.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (const r of view.rects) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(r.x + r.w / 2, r.y + r.h / 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Body: nested frames, misaligned while unstable.
    const scale = 1 - 0.55 * collapse;
    ctx.globalAlpha = 0.25 + 0.75 * alive;
    const frames = [
      { r: 44, rot: t * 0.0004, w: 2 },
      { r: 31, rot: -t * 0.0007 + 0.4, w: 1.5 },
      { r: 20, rot: t * 0.0011, w: 1 },
    ];
    // Soft body glow so the process reads as a mass, not just lines.
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 64 * scale);
    glow.addColorStop(
      0,
      hit ? 'rgb(255 236 200 / 0.55)' : `rgb(232 115 90 / ${0.35 * (1 - k) + 0.08})`,
    );
    glow.addColorStop(0.6, `rgb(191 238 242 / ${0.1 + 0.15 * k})`);
    glow.addColorStop(1, 'rgb(0 0 0 / 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 70, cy - 70, 140, 140);

    frames.forEach((f, i) => {
      const r = f.r * scale;
      const drawFrame = (dx: number, dy: number, color: string) => {
        ctx.save();
        ctx.translate(cx + dx, cy + dy);
        ctx.rotate(Math.PI / 4 + f.rot * alive);
        ctx.strokeStyle = color;
        ctx.lineWidth = f.w;
        // Broken frame: four sides with gaps that close as it stabilises.
        const gap = r * 0.5 * (1 - k) * alive;
        for (let side = 0; side < 4; side++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(-r + gap / 2, -r);
          ctx.lineTo(r - gap / 2, -r);
          ctx.stroke();
        }
        ctx.restore();
      };
      const dx = noise(i, t) * jitter * 2;
      const dy = noise(i + 7, t) * jitter * 2;
      if (jitter > 0.3) {
        // Desynchronised duplicates: the same frame, twice, out of step.
        drawFrame(dx - 2, dy, 'rgb(232 115 90 / 0.55)');
        drawFrame(-dx + 2, -dy, 'rgb(191 238 242 / 0.45)');
      }
      drawFrame(0, 0, hit ? '#fff4d6' : k > 0.99 ? '#bfeef2' : '#f4ecda');
    });

    // Orbiting fragments: small broken windows of the process.
    const count = Math.round(6 * (1 - k) * alive) + 2;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + t * 0.0009 * (i % 2 ? 1 : -1);
      const d = (58 + noise(i, t) * 6 * (1 - k)) * scale;
      const fx = cx + Math.cos(a) * d;
      const fy = cy + Math.sin(a) * d * 0.72;
      ctx.fillStyle = 'rgb(14 26 44 / 0.9)';
      ctx.fillRect(fx - 7, fy - 5, 14, 10);
      ctx.strokeStyle = i % 3 === 0 ? 'rgb(232 115 90 / 0.9)' : 'rgb(191 238 242 / 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(fx - 6.5, fy - 4.5, 13, 9);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillRect(fx - 6, fy - 4, 12, 2);
    }

    // Fragments knocked loose by each commit fly out and fade.
    for (const l of loose) {
      const age = (s.t - l.born) / 900;
      if (age > 1 || age < 0) continue;
      const d = 30 + age * 90;
      ctx.globalAlpha = (1 - age) * 0.9;
      ctx.strokeStyle = '#bfeef2';
      ctx.strokeRect(cx + Math.cos(l.angle) * d - 5, cy + Math.sin(l.angle) * d - 4, 10, 8);
    }
    ctx.globalAlpha = 1;

    // End: the lost channel is exposed where the process was.
    if (collapse > 0) {
      ctx.globalAlpha = collapse;
      ctx.strokeStyle = '#f2c14e';
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(cx - 14, cy - 14, 28, 28);
      ctx.setLineDash([]);
      ctx.fillStyle = '#f2c14e';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('02', cx, cy + 3);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };
}
