// Coop gate captures in its three states. usage: node gate.mjs OUT W H
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
  flags: { 'muralla.arrived': true },
  choices: {},
  inventory: { items: {} },
  cards: { owned: {} },
  achievements: {},
  puzzles: {
    'route.muralla_beacons': { completedAt: now, attempts: 1 },
    'system.player_sync': { completedAt: now, attempts: 1 },
  },
  boss: { defeated: true, attempts: 1, defeatedAt: now },
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
await p.waitForFunction(
  () => document.querySelector('.game-root')?.dataset.scene === 'player2Reveal',
);
for (let i = 0; i < 30; i++) {
  const bt = await p.evaluate(() => window.__reveal?.beat());
  if (bt === 'gate') break;
  await p.keyboard.press('Enter');
  await p.waitForTimeout(500);
}
await p.waitForTimeout(700);
if (await p.$('.chapter-card')) {
  await p.screenshot({ path: `${OUT}/gate-0-level-06.png` });
  await p.keyboard.press('Enter');
  await p.waitForTimeout(700);
}
await p.screenshot({ path: `${OUT}/gate-1-await.png` });
await p.keyboard.down('ArrowUp');
await p.waitForTimeout(560);
await p.keyboard.up('ArrowUp');
await p.keyboard.press('Enter');
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/gate-2-p2walk.png` });
await p.waitForFunction(
  () => window.__reveal?.gate().stage === 'p2ready' || window.__reveal?.gate().stage === 'opening',
  null,
  { timeout: 15000 },
);
await p.screenshot({ path: `${OUT}/gate-2b-p2ready.png` });
await p.waitForFunction(() => window.__reveal?.gate().stage === 'open', null, { timeout: 15000 });
await p.waitForTimeout(120);
await p.screenshot({ path: `${OUT}/gate-3-open.png` });
const fps = await p.evaluate(
  () =>
    new Promise((r) => {
      let n = 0;
      const t0 = performance.now();
      const f = () => {
        n++;
        if (performance.now() - t0 < 1500) requestAnimationFrame(f);
        else r(n / 1.5);
      };
      requestAnimationFrame(f);
    }),
);
const scroll = await p.evaluate(
  () =>
    document.documentElement.scrollWidth > innerWidth ||
    document.documentElement.scrollHeight > innerHeight,
);
console.log(
  JSON.stringify({
    W,
    H,
    errs,
    fps,
    scroll,
    final: await p.evaluate(() => window.__reveal?.beat()),
  }),
);
await b.close();
