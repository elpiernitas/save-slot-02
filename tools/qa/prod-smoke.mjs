// Production-build smoke on seeded saves (BASE=http://host/save-slot-02/).
// usage: node prod-smoke.mjs OUT W H [on|no reduced motion]
import { createRequire } from 'module';
import fs from 'fs';
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const [, , OUT, W, H, REDUCED = 'no'] = process.argv;
const BASE = process.env.BASE || 'http://localhost:4173/';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const results = [];
const now = '2026-09-28T17:00:00.000Z';
function seed(over) {
  const base = {
    version: 2,
    player: { name: null, classId: 'healer' },
    progress: {
      sceneId: 'overworld',
      checkpoint: 'muralla:terrace',
      completedScenes: ['classSelect'],
      resumeSceneId: 'overworld',
    },
    flags: { 'muralla.arrived': true },
    choices: {},
    inventory: { items: {} },
    cards: { owned: {} },
    achievements: {},
    puzzles: {},
    boss: { defeated: false, attempts: 0, defeatedAt: null },
    quests: {},
    dateQuest: { chosenOptionId: null, chosenAt: null },
    unlocks: {},
    timestamps: { createdAt: now, updatedAt: now, lastPlayedAt: now, completedAt: null },
    settings: {
      audio: { muted: false, volume: { music: 0.6, sfx: 0.8, voice: 0.5 } },
      textSpeed: 'instant',
      reducedMotion: REDUCED === 'on' ? 'on' : 'system',
    },
    system: { bootCompletedAt: now, enteredGameAt: now, sessionCount: 1, lastSessionAt: now },
  };
  return JSON.stringify({ ...base, ...over });
}
const done = {
  puzzles: {
    'route.muralla_beacons': { completedAt: now, attempts: 1 },
    'system.player_sync': { completedAt: now, attempts: 1 },
  },
};
const found = {
  'muralla.arrived': true,
  'system.player2SignalMissing': true,
  'story.player2Found': true,
};
const CASES = {
  overworld: seed({}),
  // D-085: terminal done, recalibration pending → La Muralla (overworld).
  recalibration: seed({
    ...done,
    flags: { 'muralla.arrived': true, 'system.player2SignalMissing': true },
  }),
  boss: seed({
    ...done,
    puzzles: { ...done.puzzles, 'route.recalibration': { completedAt: now, attempts: 1 } },
    flags: { 'muralla.arrived': true, 'system.player2SignalMissing': true },
  }),
  reveal: seed({ ...done, boss: { defeated: true, attempts: 1, defeatedAt: now } }),
  dateGate: seed({
    ...done,
    boss: { defeated: true, attempts: 1, defeatedAt: now },
    flags: { ...found, 'story.player2GateComplete': true },
  }),
  ending: seed({
    ...done,
    boss: { defeated: true, attempts: 1, defeatedAt: now },
    flags: { ...found, 'story.player2GateComplete': true },
    dateQuest: { chosenOptionId: 'sun-04-oct', chosenAt: now },
  }),
  corrupt: '{"version":2, this is not json',
  legacyV1: JSON.stringify({
    version: 1,
    player: { name: null, classId: 'tank' },
    progress: { sceneId: 'overworld', checkpoint: null, completedScenes: [] },
    flags: {},
    choices: {},
    inventory: { items: {} },
    cards: { owned: {} },
    achievements: {},
    puzzles: {},
    boss: { defeated: false, attempts: 0, defeatedAt: null },
    quests: {},
    dateQuest: { chosenOptionId: null, chosenAt: null },
    unlocks: {},
    timestamps: { createdAt: now, updatedAt: now, lastPlayedAt: now, completedAt: null },
    settings: {
      audio: { muted: false, volume: { music: 0.6, sfx: 0.8, voice: 0.5 } },
      textSpeed: 'normal',
      reducedMotion: 'system',
    },
  }),
};
for (const [name, data] of [...Object.entries(CASES), ['noStorage', null]]) {
  const ctx = await b.newContext({
    viewport: { width: +W, height: +H },
    reducedMotion: REDUCED === 'on' ? 'reduce' : 'no-preference',
  });
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(now));
  const errs = [],
    failed = [],
    hooks = [];
  p.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text()));
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('requestfailed', (r) => failed.push(r.url() + ' ' + r.failure()?.errorText));
  if (name === 'noStorage') {
    await p.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('denied', 'SecurityError');
        },
      });
    });
  } else {
    await p.addInitScript(
      ([d]) => {
        if (!sessionStorage.getItem('s')) {
          sessionStorage.setItem('s', '1');
          localStorage.setItem('saveSlot02:save', d);
        }
      },
      [data],
    );
  }
  await p.goto(BASE);
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
  await p.waitForTimeout(2500);
  const sceneNow = await p.evaluate(() => document.querySelector('.game-root')?.dataset.scene);
  if (name === 'boss') {
    await p.waitForTimeout(4500);
  } // into the fight
  await p.screenshot({ path: `${OUT}/${name}.png` });
  hooks.push(
    ...(await p.evaluate(() =>
      ['__desync', '__reveal', '__worldEngine'].filter((k) => k in window),
    )),
  );
  const scroll = await p.evaluate(
    () =>
      document.documentElement.scrollHeight > innerHeight ||
      document.documentElement.scrollWidth > innerWidth,
  );
  const keys = name === 'noStorage' ? [] : await p.evaluate(() => Object.keys(localStorage));
  results.push({ name, scene: sceneNow, scroll, hooks, keys, errs, failed });
  await ctx.close();
}
console.log(JSON.stringify({ W, H, REDUCED, results }, null, 1));
await b.close();
