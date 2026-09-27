// Paced new-save playthrough: normal text speed, every page typed out and read
// at READ_CPS, route pulses watched in full, THINK_MS before each object/move.
// Still drives the seagull and the boss through the dev QA hooks.
// usage: node playthrough-paced.mjs OUT W H [on|no reduced motion]
import { createRequire } from 'module';
import fs from 'fs';
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const [, , OUT, W, H, REDUCED = 'no'] = process.argv;
const BASE = process.env.BASE || 'http://localhost:5174/';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: +W, height: +H },
  reducedMotion: REDUCED === 'on' ? 'reduce' : 'no-preference',
});
const p = await ctx.newPage();
await p.clock.setFixedTime(new Date('2026-09-28T17:00:00Z'));
const errs = [],
  failed = [];
p.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text()));
p.on('pageerror', (e) => errs.push(String(e)));
p.on('requestfailed', (r) => failed.push(r.url()));
let n = 0;
const log = [];
const t0 = Date.now();
globalThis.T0 = t0;
const mark = (what, extra) =>
  log.push([
    ((Date.now() - t0) / 1000).toFixed(0) + 's',
    what,
    ...(extra === undefined ? [] : [extra]),
  ]);
const texts = [];
const grab = async (tag) =>
  texts.push([
    tag,
    await p.evaluate(() => {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const out = [];
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const el = n.parentElement;
        if (!el || el.closest('script,style')) continue;
        const t = n.textContent.trim();
        if (t && el.getClientRects().length) out.push(t);
      }
      return out.join('\n');
    }),
  ]);
const READ_CPS = 15,
  THINK_MS = 1500;
let readMs = 0,
  thinkMs = 0,
  reloadMs = 0,
  pages = 0,
  lastSeen = new Set();
const visibleText = () =>
  p.evaluate(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const out = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest('script,style')) continue;
      const t = n.textContent.trim();
      if (t && el.getClientRects().length) out.push(t);
    }
    return out;
  });
/** Wait for the typewriter / route pulse to finish on its own (never skipped). */
async function settle() {
  for (let i = 0; i < 400; i++) {
    const busy = await p.evaluate(() => {
      const d = document.querySelector('.dlg-box');
      if (d && !d.querySelector('.dlg-more') && !document.querySelector('.dlg-choices'))
        return true;
      const slots = document.querySelectorAll('.route-pulse__slot');
      return (
        slots.length > 0 &&
        document.querySelectorAll('.route-pulse__slot[data-lit]').length < slots.length
      );
    });
    if (!busy) return;
    await p.waitForTimeout(80);
  }
}
/** Read the newly visible text at READ_CPS (+0.5 s per page, max 12 s). */
async function read() {
  await settle();
  const lines = await visibleText();
  const fresh = lines.filter((l) => !lastSeen.has(l));
  lastSeen = new Set(lines);
  const chars = fresh.join(' ').length;
  const ms = chars ? Math.min(12000, 500 + (chars * 1000) / READ_CPS) : 300;
  readMs += ms;
  pages++;
  await p.waitForTimeout(ms);
}
async function readEnter() {
  await read();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(150);
}
async function think(ms = THINK_MS) {
  thinkMs += ms;
  await p.waitForTimeout(ms);
}
const shot = async (tag) => {
  await p.waitForTimeout(120);
  await grab(tag);
  await p.screenshot({ path: `${OUT}/${String(n++).padStart(2, '0')}-${tag}.png` });
};
const ALLOW = [
  'PLAYER 2 ONLINE',
  'FIRST SYNC',
  'DESYNC PROCESS',
  'PLAYER 1',
  'PLAYER 2',
  'SAVE SLOT 02',
  'CITY CARDS',
  'CITY CARD',
  'LA MURALLA',
  'MANU',
  'ENTER',
  'ESC',
  'WASD',
  'OK',
  'DESYNC',
  'CHECKSUM',
  'HOLO',
];
const EN =
  /\b(the|and|you|your|select|back|continue|settings|loading|found|ready|retry|open|close|move|interact|status|quest|route|signal|input|lock|this|system|check|display|keyboard|fullscreen|window|class|assigned|world|card added|item|new|hint|beacon|sync|access|service|recovery|process|missing|channel|node|stable|split|lost|assist|mode|available|enable|now|not|terminated|scanning|identity|data|recovered|link|party|players|required|side|destination|wed|thu|fri|sun|main|already|active|theatre|yes|saving|elapsed|expired|complete|updated|october|september|wednesday|thursday|sunday|title|return|pause|obtained|rare|common|uncommon|place|object|event|menu|city is|politely|eventually|press|skip)\b/i;
function english() {
  const out = [];
  for (const [tag, t] of texts) {
    let x = t;
    for (const a of ALLOW) x = x.split(a).join(' ');
    for (const line of x.split('\n'))
      if (EN.test(line)) out.push(tag + ' :: ' + line.trim().slice(0, 80));
  }
  return [...new Set(out)];
}
const save = () => p.evaluate(() => JSON.parse(localStorage.getItem('saveSlot02:save')));
const scene = () => p.evaluate(() => document.querySelector('.game-root')?.dataset.scene);
const scroll = () =>
  p.evaluate(() => [
    document.documentElement.scrollWidth > innerWidth,
    document.documentElement.scrollHeight > innerHeight,
  ]);

async function reopen() {
  const r0 = Date.now();
  await p.goto(BASE);
  await p.waitForSelector('.system-check__menu');
  await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Enter'); // CONTINUE IN WINDOW
  await p.waitForFunction(
    () => document.querySelector('.game-root')?.dataset.scene === 'title',
    null,
    { timeout: 15000 },
  );
  await p.waitForTimeout(500);
  await p.keyboard.press('Enter'); // CONTINUE
  await p.waitForTimeout(1200);
  reloadMs += Date.now() - r0;
}
async function drain(max = 200) {
  for (let i = 0; i < max; i++) {
    const busy = await p.$('.dlg-box, .inv-reward, .route-pulse, .class-confirm, .chapter-card');
    if (!busy) return i;
    await readEnter();
  }
  throw new Error('drain: overlay did not close');
}
const snap = () => p.evaluate(() => window.__worldEngine?.snapshot());
async function hold(key, ms) {
  await p.keyboard.down(key);
  await p.waitForTimeout(ms);
  await p.keyboard.up(key);
  await p.waitForTimeout(60);
}
async function axis(key, target, get) {
  let stuck = 0;
  for (let i = 0; i < 30; i++) {
    const s = await snap();
    const d = target - get(s.pos);
    if (Math.abs(d) <= 2) return;
    const k = key(d);
    await hold(k, Math.min(700, Math.max(25, Math.abs(d) * 9)));
    const s2 = await snap();
    if (Math.abs(get(s2.pos) - get(s.pos)) < 0.5) {
      if (++stuck >= 3) return; // really blocked
      await p.waitForTimeout(300);
    } else stuck = 0;
  }
}
const vert = (y) =>
  axis(
    (d) => (d > 0 ? 'ArrowDown' : 'ArrowUp'),
    y,
    (q) => q.y,
  );
const horz = (x) =>
  axis(
    (d) => (d > 0 ? 'ArrowRight' : 'ArrowLeft'),
    x,
    (q) => q.x,
  );
/** Explicit waypoints measured on the colliders: ['v', y] / ['h', x]. */
async function path(steps) {
  for (const [k, v] of steps) await (k === 'v' ? vert(v) : horz(v));
}
async function use(id, steps) {
  await think();
  await path(steps);
  await hold('ArrowUp', 450);
  const s = await snap();
  if (s.target?.id !== id) {
    await shot('FAIL-' + id);
    console.log(JSON.stringify(log));
  }
  if (s.target?.id !== id)
    throw new Error(`target ${s.target?.id} !== ${id} at ${JSON.stringify(s.pos)}`);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(350);
}

// ---------- fresh save ----------
await p.goto(BASE);
await p.evaluate(() => localStorage.clear());
await p.goto(BASE);
await p.waitForSelector('.system-check__menu');
await shot('system-check');
mark('scroll at start', await scroll());
await p.keyboard.press('ArrowDown');
await p.keyboard.press('Enter');
for (let i = 0; i < 60 && (await scene()) !== 'title'; i++) {
  await grab('startup-' + i);
  await readEnter();
}
await shot('title');
mark('title', await p.textContent('.title__tagline'));
await p.keyboard.press('ArrowDown');
await p.keyboard.press('Enter');
await p.waitForTimeout(300);
await shot('title-settings');
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
await p.keyboard.press('ArrowUp');
await p.keyboard.press('Enter');
await p.waitForTimeout(1000);
// Class select: intro, pick the second class (TANQUE) with the mouse-free path.
for (let i = 0; i < 60 && (await scene()) === 'classSelect'; i++) {
  await grab('class-' + i);
  if (i === 6) {
    await shot('class-select');
    await think(4000);
    await p.keyboard.press('ArrowRight');
  }
  await readEnter();
}
await p.waitForSelector('.overworld__canvas');
await p.waitForTimeout(800);
mark('class', (await save()).player.classId);
await p.waitForSelector('.chapter-card', { timeout: 5000 });
await shot('level-01-card');
await drain();
await shot('muralla-arrival');
mark(
  'premature PLAYER 2 text in DOM?',
  await p.evaluate(() => /MANU/.test(document.body.innerText)),
);

// Waitress → card 001 → route update → pattern.
await use('waitress', [['h', 497]]);
await shot('waitress');
await drain();
mark('cards after waitress', Object.keys((await save()).cards.owned));
await shot('after-waitress');
// Pause, inventory, binder and a card, then back to the world.
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
await shot('pause');
await p.keyboard.press('ArrowDown');
await p.keyboard.press('Enter');
await p.waitForTimeout(300);
await shot('inventory');
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
await p.keyboard.press('ArrowDown');
await p.keyboard.press('Enter');
await p.waitForTimeout(300);
await shot('binder');
await p.keyboard.press('Enter');
await p.waitForTimeout(300);
await shot('binder-card');
await p.keyboard.press('Escape');
await p.waitForTimeout(200);
await p.keyboard.press('Escape');
await p.waitForTimeout(200);
await p.keyboard.press('ArrowUp');
await p.keyboard.press('ArrowUp');
await p.keyboard.press('Enter');
await p.waitForTimeout(400);
mark('back in world', !(await p.$('.overworld__menu')));
// Refresh checkpoint: La Muralla.
await reopen();
mark('refresh@muralla →', await scene());
await drain();

// Beacons CUP → LAMP → BIRD.
await shot('route-hud');
await use('board', [
  ['v', 318],
  ['h', 225],
  ['v', 332],
  ['h', 128],
]);
await drain();
await use('lamp', [
  ['v', 332],
  ['h', 200],
]);
await drain();
await use('gull', [
  ['v', 332],
  ['h', 167],
]);
await shot('beacon-bird');
// Round 2 (pacing pass): the round-done dialogue, then the new pattern.
for (let i = 0; i < 60 && !(await p.$('.route-pulse')); i++) await readEnter();
await settle();
await shot('beacons-round-2-pattern');
await drain();
mark(
  'beacon round',
  await p.evaluate(() => document.querySelector('.route-hud__text')?.textContent),
);
await use('gull', [
  ['v', 332],
  ['h', 167],
]);
await drain();
await use('board', [
  ['v', 332],
  ['h', 128],
]);
await drain();
await use('lamp', [
  ['v', 332],
  ['h', 200],
]);
await drain();
await use('board', [
  ['v', 332],
  ['h', 128],
]);
await drain();
await use('gull', [
  ['v', 332],
  ['h', 167],
]);
await drain();
const s1 = await save();
mark(
  'beacons puzzle',
  Object.hasOwn(s1.puzzles, 'route.muralla_beacons'),
  Object.keys(s1.cards.owned),
);
await reopen();
mark('refresh@after-puzzle →', await scene());
await drain();

// ---------- NIVEL 03: PROTOCOLO DE LA GAVIOTA ----------
await shot('level-03-hud');
mark(
  'level after beacons',
  await p.evaluate(() => document.querySelector('.chapter-hud__level')?.textContent),
);
// The door of nº 12 is blocked until the seagull is dealt with.
await use('barDoor', [
  ['v', 332],
  ['h', 355],
  ['v', 316],
  ['h', 688],
  ['v', 338],
  ['h', 725],
]);
await p.waitForTimeout(300);
await shot('door-blocked');
await drain();
mark('door blocked (no terminal)', !(await p.$('.sync-terminal')));
// Board hint, then the seagull.
await use('board', [
  ['h', 688],
  ['v', 316],
  ['h', 225],
  ['v', 332],
  ['h', 128],
]);
await shot('seagull-hint');
await drain();
await use('gull', [
  ['v', 332],
  ['h', 167],
]);
for (let i = 0; i < 60 && !(await p.$('.seagull')); i++) await readEnter();
await p.waitForSelector('.seagull');
await p.waitForTimeout(300);
await shot('seagull-ready');
await read();
const tSeagull = Date.now();
let seagullShot = false;
for (let t = Date.now(); Date.now() - t < 90000;) {
  const st = await p.evaluate(() => window.__seagull?.state());
  if (!st || st.phase === 'cleared' || st.phase === 'bored') {
    mark('seagull outcome', st?.phase ?? 'closed', st?.failures);
    break;
  }
  if (st.phase === 'telegraph') {
    if (!seagullShot && st.dive === 2) {
      seagullShot = true;
      await shot('seagull-telegraph');
    }
    const marked = new Set(
      (await p.evaluate(() => window.__seagull.marked())).map(([c, r]) => `${c},${r}`),
    );
    if (marked.has(`${st.pos[0]},${st.pos[1]}`)) {
      let best = null,
        bd = 99;
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 5; c++) {
          const d = Math.abs(c - st.pos[0]) + Math.abs(r - st.pos[1]);
          if (!marked.has(`${c},${r}`) && d < bd) {
            best = [c, r];
            bd = d;
          }
        }
      const key =
        best[0] > st.pos[0]
          ? 'ArrowRight'
          : best[0] < st.pos[0]
            ? 'ArrowLeft'
            : best[1] > st.pos[1]
              ? 'ArrowDown'
              : 'ArrowUp';
      await p.keyboard.press(key);
    }
  }
  await p.waitForTimeout(40);
}
mark('seagull seconds', Math.round((Date.now() - tSeagull) / 1000));
await p.waitForTimeout(1800);
await shot('seagull-done');
await drain();
const s2 = await save();
mark(
  'seagull puzzle + card 003',
  Object.hasOwn(s2.puzzles, 'route.seagull_protocol'),
  Object.keys(s2.cards.owned),
  Object.keys(s2.achievements),
);
mark(
  'level after seagull',
  await p.evaluate(() => document.querySelector('.chapter-hud__level')?.textContent),
);
await shot('level-04-hud');
await reopen();
mark('refresh@after-seagull →', await scene());
await drain();

// SERVICE ACCESS → terminal.
await use('barDoor', [
  ['v', 332],
  ['h', 355],
  ['v', 316],
  ['h', 688],
  ['v', 338],
  ['h', 725],
]);
await drain();
await p.waitForSelector('.sync-terminal');
await shot('terminal');
await read();
await think(4000);
await p.keyboard.press('Enter');
await think();
await p.keyboard.press('ArrowRight');
await think();
await p.keyboard.press('Enter');
await think();
await p.keyboard.press('Enter');
await think();
await p.keyboard.press('ArrowDown');
await think();
await p.keyboard.press('Enter');
await think();
await p.keyboard.press('Enter');
await think();
await p.keyboard.press('ArrowRight');
await think();
await p.keyboard.press('Enter');
await p.waitForSelector('.sync-terminal__fallback', { timeout: 15000 });
await shot('terminal-fallback');
mark('MANU visible at terminal?', await p.evaluate(() => /MANU/.test(document.body.innerText)));
await readEnter();
await p.waitForSelector('.desync', { timeout: 20000 });
mark('terminal → boss', await scene());

// ---------- boss (same bot as GAME-07 QA) ----------
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
await p.waitForTimeout(700);
await shot('boss-entry-level-05');
mark(
  'boss entry card',
  await p.evaluate(() => document.querySelector('.chapter-card')?.innerText.replace(/\n/g, ' | ')),
);
mark('MANU visible in boss?', await p.evaluate(() => /MANU/.test(document.body.innerText)));
await p.waitForFunction(() => window.__desync?.stage().kind === 'intro', null, { timeout: 15000 });
await shot('boss-intro');
await p.waitForFunction(() => window.__desync?.stage().kind === 'fight', null, { timeout: 20000 });
await p.waitForTimeout(3500);
await shot('boss-fight');
let res = await fight();
mark('boss attempt', res);
while (res === 'failed') {
  await shot('signal-lost');
  await read();
  await p.keyboard.press('Enter');
  res = await fight();
  mark('boss attempt', res);
}
for (const beat of ['found', 'slot']) {
  await p.waitForFunction((b) => window.__reveal?.beat() === b, beat, { timeout: 20000 });
  await p.waitForTimeout(300);
  await grab('reveal-' + beat);
}
await shot('boss-terminated');
await p.waitForSelector('.reveal', { timeout: 15000 });
mark('boss saved', (await save()).boss);

// ---------- reveal ----------
await p.waitForFunction(() => window.__reveal?.beat() === 'name', null, { timeout: 20000 });
await p.waitForTimeout(600);
await shot('reveal-manu');
await p.waitForFunction(() => window.__reveal?.beat() === 'line', null, { timeout: 20000 });
await shot('reveal-line');
// Refresh mid-reveal: never the boss.
await reopen();
mark('refresh@after-boss →', await scene());
for (let i = 0; i < 40; i++) {
  const bt = await p.evaluate(() => window.__reveal?.beat());
  if (bt === 'gate') break;
  await readEnter();
}
await p.waitForTimeout(400);
if (await p.$('.chapter-card')) {
  await shot('level-06-card');
  await readEnter();
}
await hold('ArrowUp', 560);
await p.keyboard.press('Enter');
await p.waitForTimeout(900);
await shot('gate-coop');
await grab('gate-play');
await p.waitForFunction(() => window.__reveal?.beat() === 'end', null, { timeout: 15000 });
await shot('gate-open');
await p.waitForSelector('.date-gate', { timeout: 15000 });

// ---------- date gate (mouse) ----------
if (await p.$('.chapter-card')) {
  await shot('level-07-card');
  await readEnter();
}
await shot('date-gate');
await read();
if (await p.$('.dlg-box')) {
  await p.click('.dlg-box');
  await p.waitForTimeout(200);
  await read();
}
await think(6000);
const gates = await p.$$('.date-gate__gate');
await gates[2].click({ force: true });
await p.waitForTimeout(200);
mark('friday click opens confirm?', !!(await p.$('text=¿FIJAR ESTA RUTA?')));
await gates[1].click();
await p.waitForTimeout(200);
await shot('date-confirm');
await read();
await p.click('text=SÍ');
await p.waitForTimeout(300);
mark('date saved', (await save()).dateQuest);
await p.waitForSelector('.ending', { timeout: 15000 });
await reopen();
mark('refresh@after-date →', await scene());

// ---------- ending ----------
for (let i = 0; i < 40 && (await scene()) === 'ending'; i++) {
  await grab('ending-' + i);
  await readEnter();
}
await p.waitForSelector('.save-slot');
await p.waitForTimeout(3200);
await shot('save-slot');
await read();
mark(
  'achievements',
  Object.keys((await save()).achievements),
  'unlocks',
  Object.keys((await save()).unlocks),
);
await p.click('.save-slot__randy');
await p.waitForTimeout(300);
await shot('save-slot-randy');
await p.click('.save-slot__randy');
mark(
  'slot',
  await p.evaluate(() =>
    [...document.querySelectorAll('.save-slot__row')].map((r) => r.innerText.replace(/\n/g, ' ')),
  ),
);
await p.click('text=CITY CARDS');
await p.waitForTimeout(300);
await shot('slot-cards');
mark('binder cards', await p.evaluate(() => document.querySelectorAll('.inv-slot').length));
await p.keyboard.press('Escape');
await p.waitForTimeout(200);
await p.click('text=AJUSTES');
await p.waitForTimeout(300);
await shot('slot-settings');
await p.keyboard.press('Escape');
await p.waitForTimeout(200);
await reopen();
mark('refresh@slot →', await scene());
mark(
  'title tagline after completion',
  await (async () => {
    await p.click('text=VOLVER AL TÍTULO');
    await p.waitForTimeout(900);
    return p.textContent('.title__tagline');
  })(),
);
mark('scroll at end', await scroll());
const fin = await save();
mark('final save', {
  completedAt: fin.timestamps.completedAt,
  date: fin.dateQuest.chosenOptionId,
  boss: fin.boss,
  resume: fin.progress.resumeSceneId,
});
mark('LANGUAGE GATE — English lines', english());
const totalS = (Date.now() - t0) / 1000;
console.log(
  JSON.stringify(
    {
      W,
      H,
      REDUCED,
      BASE,
      pace: {
        totalS,
        reloadS: reloadMs / 1000,
        netS: totalS - reloadMs / 1000,
        readS: readMs / 1000,
        thinkS: thinkMs / 1000,
        pages,
        READ_CPS,
        THINK_MS,
      },
      log,
      errs,
      failed,
    },
    null,
    1,
  ),
);
await b.close();
