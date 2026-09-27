// Boss captures: entry, active fight, failure, terminated. usage: node boss.mjs OUT W H
import { createRequire } from 'module';
import fs from 'fs';
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const [, , OUT, W, H] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: +W, height: +H } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
const now = '2026-09-28T17:00:00.000Z';
await p.clock.setFixedTime(new Date(now));
const save = {
  version: 2,
  player: { name: null, classId: 'healer' },
  progress: {
    sceneId: 'overworld',
    checkpoint: 'muralla:terrace',
    completedScenes: ['classSelect'],
    resumeSceneId: 'overworld',
  },
  flags: { 'muralla.arrived': true, 'system.player2SignalMissing': true },
  choices: {},
  inventory: { items: {} },
  cards: { owned: {} },
  achievements: {},
  puzzles: {
    'route.muralla_beacons': { completedAt: now, attempts: 1 },
    'route.seagull_protocol': { completedAt: now, attempts: 1 },
    'system.player_sync': { completedAt: now, attempts: 1 },
    'route.recalibration': { completedAt: now, attempts: 1 },
  },
  boss: { defeated: false, attempts: 0, defeatedAt: null },
  quests: {},
  dateQuest: { chosenOptionId: null, chosenAt: null },
  unlocks: {},
  timestamps: { createdAt: now, updatedAt: now, lastPlayedAt: now, completedAt: null },
  settings: {
    audio: { muted: true, volume: { music: 0.6, sfx: 0.8, voice: 0.5 } },
    textSpeed: 'instant',
    reducedMotion: 'system',
  },
  system: { bootCompletedAt: now, enteredGameAt: now, sessionCount: 1, lastSessionAt: now },
};
await p.addInitScript(
  ([d]) => {
    if (!sessionStorage.getItem('s')) {
      sessionStorage.setItem('s', '1');
      localStorage.setItem('saveSlot02:save', d);
    }
  },
  [JSON.stringify(save)],
);
await p.goto(process.env.BASE || 'http://localhost:5174/');
await p.waitForSelector('.system-check__menu');
await p.keyboard.press('ArrowDown');
await p.keyboard.press('Enter');
for (let i = 0; i < 40; i++) {
  const sc = await p.evaluate(() => document.querySelector('.game-root')?.dataset.scene);
  if (sc === 'title') break;
  await p.keyboard.press('Enter');
  await p.waitForTimeout(350);
}
await p.keyboard.press('Enter');
await p.waitForSelector('.desync', { timeout: 20000 });
const shot = async (tag) => p.screenshot({ path: `${OUT}/${tag}.png` });
await p.waitForTimeout(900);
await shot('boss-1-entry');
await p.waitForFunction(() => window.__desync?.stage().kind === 'fight', null, { timeout: 30000 });
await p.waitForTimeout(3200);
await shot('boss-2-fight');
const SAFE = { x: 88, y: 58, w: 464, h: 248 };
const NODES = { a: { x: 170, y: 110 }, b: { x: 470, y: 110 }, c: { x: 320, y: 280 } };
const CORE = { x: 320, y: 182 };
const PH = { checksum: ['a'], split: ['b', 'c'], missing: [] };
let held = null;
async function hk(dir) {
  const key =
    dir && { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir];
  if (key === held) return;
  if (held) await p.keyboard.up(held);
  if (key) await p.keyboard.down(key);
  held = key;
}
const foot = (pl, m) => ({ x: pl.x - 7 - m, y: pl.y - 10 - m, w: 14 + 2 * m, h: 10 + 2 * m });
const ov = (a, r) => a.x < r.x + r.w && r.x < a.x + a.w && a.y < r.y + r.h && r.y < a.y + a.h;
function inDanger(pt, h, m = 8) {
  if (!h || h.stage === 'recovery') return false;
  if (h.ring) {
    const d = Math.hypot(pt.x - CORE.x, pt.y - 5 - CORE.y);
    return d >= h.ring.inner - m && d < h.ring.outer + m;
  }
  return h.rects.some((r) => ov(foot(pt, m), r));
}
function escape(s, h) {
  const opts = ['up', 'down', 'left', 'right'].map((d) => {
    const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d];
    for (let k = 4; k < 400; k += 4) {
      const pt = { x: s.player.x + v[0] * k, y: s.player.y + v[1] * k };
      if (
        pt.x < SAFE.x + 7 ||
        pt.x > SAFE.x + SAFE.w - 7 ||
        pt.y < SAFE.y + 10 ||
        pt.y > SAFE.y + SAFE.h
      )
        return [d, 1e9];
      if (!inDanger(pt, h, 10)) return [d, k];
    }
    return [d, 1e9];
  });
  opts.sort((a, b) => a[1] - b[1]);
  return opts[0][0];
}
function toward(s, t) {
  const dx = t.x - s.player.x,
    dy = t.y - s.player.y;
  if (Math.abs(dx) > 5) return dx > 0 ? 'right' : 'left';
  if (Math.abs(dy) > 5) return dy > 0 ? 'down' : 'up';
  return null;
}
async function fight() {
  for (let t = Date.now(); Date.now() - t < 180000;) {
    const r = await p.evaluate(
      () =>
        window.__desync && {
          s: window.__desync.state(),
          h: window.__desync.hazard(),
          st: window.__desync.stage().kind,
        },
    );
    if (!r) return 'left';
    const { s, h, st } = r;
    if (st !== 'fight') {
      if (st === 'intro' || st === 'title' || st === 'chapter') {
        await p.waitForTimeout(100);
        continue;
      }
      await hk(null);
      return st;
    }
    if (!globalThis.midShot && s.phase === 'split' && !s.banner && s.nodes.b + s.nodes.c >= 2) {
      globalThis.midShot = true;
      await hk(null);
      await p.screenshot({ path: `${OUT}/boss-3-damaged.png` });
    }
    let dir;
    if (inDanger(s.player, h)) dir = escape(s, h);
    else {
      const open = PH[s.phase].find((id) => s.nodes[id] < 3);
      const target = s.banner ? s.player : open ? NODES[open] : CORE;
      dir = toward(s, target);
      if (dir) {
        const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
        if (inDanger({ x: s.player.x + v[0] * 16, y: s.player.y + v[1] * 16 }, h, 10)) dir = null;
      }
      if (!dir) await p.keyboard.press('Enter');
    }
    await hk(dir);
    await p.waitForTimeout(30);
  }
  return 'timeout';
}

let res = await fight();
const results = [res];
while (res === 'failed') {
  await hk(null);
  await shot('boss-2b-signal-lost');
  await p.waitForTimeout(400); /* defeat menu input guard */
  await p.keyboard.press('ArrowUp');
  await p.keyboard.press('ArrowUp');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(500);
  res = await fight();
  results.push(res);
}
await p.waitForTimeout(500);
await shot('boss-4-terminated');
await p.waitForTimeout(700);
await shot('boss-5-collapsed');
console.log(JSON.stringify({ W, H, results, errs }));
await b.close();
