// Reveal beats: slot card, Manu's portrait (name beat), line, co-op room entry. usage: node reveal.mjs OUT W H
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
const failed = [];
p.on('requestfailed', (r) => failed.push(r.url()));
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
  },
  boss: { defeated: true, attempts: 1, defeatedAt: now },
  quests: {},
  dateQuest: { chosenOptionId: null, chosenAt: null },
  unlocks: {},
  timestamps: { createdAt: now, updatedAt: now, lastPlayedAt: now, completedAt: null },
  settings: {
    audio: { muted: true, volume: { music: 0.6, sfx: 0.8, voice: 0.5 } },
    textSpeed: 'normal',
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
await p.waitForSelector('.reveal__slot', { timeout: 20000 });
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/reveal-1-slot.png` });
// Wait for the resolved slot (name beat) — by DOM, works on production builds too.
await p.waitForSelector('.reveal__slot[data-resolved] .reveal__frame img', { timeout: 20000 });
await p.waitForTimeout(700);
const img = await p.evaluate(() => {
  const i = document.querySelector('.reveal__frame img');
  return (
    i && { complete: i.complete, w: i.naturalWidth, h: i.naturalHeight, src: i.getAttribute('src') }
  );
});
// One frame: the page shot and the portrait's rect in the same state (the zoom is cropped from it).
const [box] = await Promise.all([
  p.evaluate(() => {
    const r = document
      .querySelector('.reveal__slot[data-resolved] .reveal__frame')
      ?.getBoundingClientRect();
    return r && { x: r.x, y: r.y, w: r.width, h: r.height };
  }),
  p.screenshot({ path: `${OUT}/reveal-2-manu-portrait.png` }),
]);
fs.writeFileSync(`${OUT}/portrait-box.json`, JSON.stringify(box));
await p.waitForSelector('.dlg-box', { timeout: 20000 });
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/reveal-3-line.png` });
for (let i = 0; i < 20 && !(await p.$('.chapter-card')); i++) {
  await p.keyboard.press('Enter');
  await p.waitForTimeout(500);
}
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/reveal-4-coop-entry.png` });
console.log(JSON.stringify({ W, H, img, errs, failed }));
await b.close();
