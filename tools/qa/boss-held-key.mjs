// Regression (D-083): lose the boss fight while holding an arrow; the defeat /
// assist menu must stay on its first option. usage: node boss-held-key.mjs OUT W H
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
// Regression: lose the fight while holding ArrowDown; the defeat menu must stay on REINTENTAR.
await p.evaluate(() => {
  window.__reps = [];
  addEventListener('keydown', (e) => window.__reps.push(e.repeat), true);
});
await p.waitForFunction(() => window.__desync?.stage().kind === 'fight', null, { timeout: 30000 });
const out = [];
for (let round = 0; round < 2; round++) {
  let st = 'fight';
  let key = null;
  for (let t = Date.now(); Date.now() - t < 120000 && st === 'fight';) {
    // Walk into the telegraphed attack, holding the arrow (repeats once held).
    const r = await p.evaluate(() => ({
      s: window.__desync.state(),
      h: window.__desync.hazard(),
      st: window.__desync.stage().kind,
    }));
    st = r.st;
    if (st !== 'fight') break;
    let tx = r.s.player.x,
      ty = r.s.player.y;
    if (r.h?.rects?.length) {
      const q = r.h.rects[0];
      tx = q.x + q.w / 2;
      ty = q.y + q.h / 2 + 5;
    } else if (r.h?.ring) {
      tx = 320 + (r.h.ring.inner + r.h.ring.outer) / 2;
      ty = 187;
    }
    const dx = tx - r.s.player.x,
      dy = ty - r.s.player.y;
    const want =
      r.s.integrity === 1
        ? dy >= 0
          ? 'ArrowDown'
          : 'ArrowUp'
        : Math.abs(dx) > 4
          ? dx > 0
            ? 'ArrowRight'
            : 'ArrowLeft'
          : Math.abs(dy) > 4
            ? dy > 0
              ? 'ArrowDown'
              : 'ArrowUp'
            : key || 'ArrowDown';
    if (want !== key) {
      if (key) await p.keyboard.up(key);
      key = want;
    }
    await p.keyboard.down(key); // already held → auto-repeat keydown
    await p.waitForTimeout(40);
  }
  // Keep holding the fight's last (vertical) direction: only auto-repeats from here on.
  const heldKey = key || 'ArrowDown';
  if (round === 1) {
    // Round 2: a *fresh* arrow pressed at the moment of the hit (a dodge), then a
    // deliberate press half a second later.
    await p.keyboard.up(heldKey);
    await p.keyboard.press('ArrowDown');
    const atOpen = await p.evaluate(
      () => document.querySelector('.desync__panel [aria-current="true"]')?.textContent,
    );
    await p.waitForTimeout(500);
    await p.keyboard.press('ArrowDown');
    const later = await p.evaluate(
      () => document.querySelector('.desync__panel [aria-current="true"]')?.textContent,
    );
    await p.keyboard.press('ArrowUp');
    const back = await p.evaluate(
      () => document.querySelector('.desync__panel [aria-current="true"]')?.textContent,
    );
    await p.screenshot({ path: `${OUT}/boss-menu-fresh-arrow.png` });
    console.error('fresh-at-open', JSON.stringify({ atOpen, later, back }));
    out.push({ stage: st, freshAtOpen: atOpen, afterGuard: later, back });
    await p.keyboard.press('ArrowDown');
    await p.keyboard.press('Enter'); // AHORA NO
    break;
  }
  // Keep holding for a second after the panel opens.
  const mark = await p.evaluate(() => window.__reps.length);
  const trace = [];
  for (let i = 0; i < 25; i++) {
    await p.keyboard.down(heldKey);
    await p.waitForTimeout(40);
    trace.push(
      await p.evaluate(
        () =>
          document.querySelector('.desync__panel [aria-current="true"]')?.textContent?.[0] || '-',
      ),
    );
  }
  console.error(
    'after-open',
    await p.evaluate((m) => window.__reps.slice(m).join(','), mark),
    trace.join(''),
  );
  const cur = await p.evaluate(
    () => document.querySelector('.desync__panel [aria-current="true"]')?.textContent,
  );
  const scene = await p.evaluate(() => document.querySelector('.game-root')?.dataset.scene);
  await p.screenshot({ path: `${OUT}/boss-defeat-menu-held-${round + 1}.png` });
  out.push({ stage: st, heldKey, cursor: cur, scene });
  await p.keyboard.up(heldKey);
  // Retry with a fresh Enter (assist panel: fresh Enter on first option = ACTIVAR is fine; decline instead to keep mechanics)
  if (st === 'failed') await p.keyboard.press('Enter');
  else {
    await p.keyboard.press('ArrowDown');
    await p.keyboard.press('Enter');
  }
  await p
    .waitForFunction(() => window.__desync?.stage().kind === 'fight', null, { timeout: 30000 })
    .catch(() => {});
}
const reps = await p.evaluate(() => [
  window.__reps.filter(Boolean).length,
  window.__reps.filter((r) => !r).length,
]);
console.log(JSON.stringify({ W, H, out, repeatEvents: reps[0], freshEvents: reps[1], errs }));
await b.close();
