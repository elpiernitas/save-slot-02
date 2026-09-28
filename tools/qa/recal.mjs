// Recalibration captures from seeded saves. usage: node recal.mjs OUT W H
import { createRequire } from 'module';
import fs from 'fs';
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const [, , OUT, W, H] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const now = '2026-09-28T17:00:00.000Z';
const seen = {
  'chapter.seen.01': true,
  'chapter.seen.02': true,
  'chapter.seen.03': true,
  'chapter.seen.04': true,
};
const mk = (puzzles, flags) => ({
  version: 2,
  player: { name: null, classId: 'healer' },
  progress: {
    sceneId: 'overworld',
    checkpoint: 'muralla:terrace',
    completedScenes: ['classSelect'],
    resumeSceneId: 'overworld',
  },
  flags: {
    'muralla.arrived': true,
    'muralla.metWaitress': true,
    'route.updated': true,
    ...seen,
    ...flags,
  },
  choices: {},
  inventory: { items: {} },
  cards: { owned: {} },
  achievements: {},
  puzzles: Object.fromEntries(puzzles.map((id) => [id, { completedAt: now, attempts: 1 }])),
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
});
const out = {};
for (const [tag, save] of [
  ['level-02-calibrating', mk([], {})],
  [
    'level-04-recalibrating',
    mk(['route.muralla_beacons', 'route.seagull_protocol', 'system.player_sync'], {
      'system.player2SignalMissing': true,
    }),
  ],
]) {
  const ctx = await b.newContext({ viewport: { width: +W, height: +H } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.clock.setFixedTime(new Date(now));
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
    if ((await p.evaluate(() => document.querySelector('.game-root')?.dataset.scene)) === 'title')
      break;
    await p.keyboard.press('Enter');
    await p.waitForTimeout(350);
  }
  await p.keyboard.press('Enter');
  await p.waitForSelector('.overworld__canvas');
  await p.waitForTimeout(1500);
  for (let i = 0; i < 10 && (await p.$('.dlg-box, .route-pulse, .chapter-card')); i++) {
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/${tag}-hud.png` });
  const r = (sel) =>
    p.evaluate((s) => {
      const e = document.querySelector(s)?.getBoundingClientRect();
      return (
        e && [Math.round(e.left), Math.round(e.top), Math.round(e.right), Math.round(e.bottom)]
      );
    }, sel);
  out[tag] = {
    chapter: await r('.chapter-hud'),
    route: await r('.route-hud'),
    text: await p.evaluate(() => document.querySelector('.route-hud__text')?.textContent),
    goal: await p.evaluate(() =>
      document.querySelector('.chapter-hud')?.innerText.replace(/\n/g, ' | '),
    ),
    scene: await p.evaluate(() => document.querySelector('.game-root')?.dataset.scene),
    errs,
  };
  await ctx.close();
}
console.log(JSON.stringify({ W, H, out }, null, 1));
await b.close();
