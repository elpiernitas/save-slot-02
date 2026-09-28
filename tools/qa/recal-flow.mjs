// D-085 recalibration checks: mid-segment refresh, completion → boss, legacy save.
// usage: node recal-flow.mjs OUT W H
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
}
async function drain(max = 80) {
  for (let i = 0; i < max; i++) {
    const busy = await p.$('.dlg-box, .inv-reward, .route-pulse, .class-confirm, .chapter-card');
    if (!busy) return i;
    await p.keyboard.press('Enter');
    await p.waitForTimeout(260);
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

const now = '2026-09-28T17:00:00.000Z';
const seen = {
  'chapter.seen.01': true,
  'chapter.seen.02': true,
  'chapter.seen.03': true,
  'chapter.seen.04': true,
};
const mk = (
  puzzles,
  boss = { defeated: false, attempts: 0, defeatedAt: null },
  resume = 'overworld',
) => ({
  version: 2,
  player: { name: null, classId: 'healer' },
  progress: {
    sceneId: resume,
    checkpoint: 'muralla:terrace',
    completedScenes: ['classSelect'],
    resumeSceneId: resume,
  },
  flags: {
    'muralla.arrived': true,
    'muralla.metWaitress': true,
    'route.updated': true,
    'system.player2SignalMissing': true,
    ...seen,
  },
  choices: {},
  inventory: { items: {} },
  cards: { owned: {} },
  achievements: {},
  puzzles: Object.fromEntries(puzzles.map((id) => [id, { completedAt: now, attempts: 1 }])),
  boss,
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
});
const PRE = ['route.muralla_beacons', 'route.seagull_protocol', 'system.player_sync'];
const hud = () =>
  p.evaluate(() => ({
    text: document.querySelector('.route-hud__text')?.textContent,
    synced: document.querySelectorAll('.route-hud__slot[data-synced]').length,
    slots: document.querySelectorAll('.route-hud__slot').length,
    goal: document.querySelector('.chapter-hud__goal')?.textContent,
  }));
async function seed(save) {
  await p.goto(BASE);
  await p.waitForSelector('.system-check__menu'); // app booted: its own writes are done
  await p.evaluate((d) => {
    localStorage.clear();
    localStorage.setItem('saveSlot02:save', d);
  }, JSON.stringify(save));
  await reopen();
  await p.waitForTimeout(800);
}

// 1) Recalibration pending (terminal done, boss never entered): CONTINUE lands in La Muralla.
await seed(mk(PRE));
mark('pending → scene', [await scene(), await hud()]);
await drain();
await shot('recal-hud-terrace');
// Camera scrolled right (where the recalibration starts, by door 12): the stack must stay under the sign.
await path([
  ['v', 332],
  ['h', 355],
  ['v', 316],
  ['h', 688],
  ['v', 338],
  ['h', 725],
]);
await p.waitForTimeout(400);
await shot('recal-hud-door12');
await path([
  ['h', 688],
  ['v', 316],
  ['h', 225],
  ['v', 332],
]);
// Two beacons synced: lamp, gull (RECAL_SEQUENCE starts lamp, bird).
await use('lamp', [
  ['v', 332],
  ['h', 200],
]);
await drain();
await use('gull', [
  ['v', 332],
  ['h', 167],
]);
await drain();
mark('after 2 beacons', await hud());
await shot('recal-mid-2-of-6');
// Refresh mid-segment.
await reopen();
await drain();
mark('refresh mid → scene', [await scene(), await hud()]);
await shot('recal-after-refresh');
// Complete the whole order from scratch.
for (const [id, steps] of [
  [
    'lamp',
    [
      ['v', 318],
      ['h', 225],
      ['v', 332],
      ['h', 200],
    ],
  ],
  [
    'gull',
    [
      ['v', 332],
      ['h', 167],
    ],
  ],
  [
    'board',
    [
      ['v', 332],
      ['h', 128],
    ],
  ],
  [
    'gull',
    [
      ['v', 332],
      ['h', 167],
    ],
  ],
  [
    'lamp',
    [
      ['v', 332],
      ['h', 200],
    ],
  ],
]) {
  await use(id, steps);
  await drain();
}
await shot('recal-5-of-6');
await use('board', [
  ['v', 332],
  ['h', 128],
]);
await p.waitForSelector('.dlg-box', { timeout: 15000 });
await p.waitForTimeout(400);
await shot('recal-complete');
for (let i = 0; i < 40 && !(await p.$('.desync')); i++) {
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
}
await p.waitForSelector('.desync', { timeout: 20000 });
await p.waitForTimeout(700);
await shot('recal-to-boss');
mark('after recal → scene', [
  await scene(),
  Object.hasOwn((await save()).puzzles, 'route.recalibration'),
]);

// 2) Legacy save: terminal done, boss already started (attempts 1), no recalibration.
await seed(mk(PRE, { defeated: false, attempts: 1, defeatedAt: null }, 'boss'));
mark('legacy (boss started) → scene', await scene());
await shot('legacy-boss-started');

// 3) Terminal done, boss never started, but last scene was boss (entered before this update).
await seed(mk(PRE, { defeated: false, attempts: 0, defeatedAt: null }, 'boss'));
mark('terminal done, boss not started → scene', [await scene(), await hud()]);

// 4) Recalibration already completed (boss not started yet): CONTINUE goes to the boss, never repeats it.
await seed(mk([...PRE, 'route.recalibration']));
mark('recal done → scene', await scene());
console.log(JSON.stringify({ W, H, log, errs, failed }, null, 1));
await b.close();
