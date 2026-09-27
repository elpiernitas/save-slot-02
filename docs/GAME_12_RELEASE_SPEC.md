# GAME-12 — Production QA + Netlify Release

Status: **PREPARED / FINAL RELEASE PHASE**

## 1. Goal

Ship one private, reliable desktop-first web game link that Luis can open and
finish without developer intervention.

Release target:
**Monday 28 September 2026**

## 2. Release criteria

P0 release requires:
- GAME-04R accepted;
- core path from new save → class → world → puzzles → boss → PLAYER 2 →
  date choice → ending works;
- save persists;
- keyboard path complete;
- fullscreen fallback safe;
- no mobile gameplay requirement;
- no console errors;
- no broken images;
- no player-facing placeholder/debug text;
- production Netlify URL works;
- noindex remains active.

GAME-10 extras are not release blockers.

## 3. Browser matrix

Required real-browser QA where available:

### Chrome / Chromium
P0.
- latest desktop;
- 1920×1080;
- 1440×900;
- 1366×768.

### Safari macOS
P0 for Manu's environment if practical.
- fullscreen API behaviour;
- audio unlock;
- localStorage;
- canvas scaling.

### Firefox
P1 but strongly preferred.
- keyboard;
- canvas;
- audio;
- fullscreen fallback.

### Edge
P1 if Chromium Chrome pass is clean.

## 4. Device policy

Desktop-first.

Expected:
- laptop/desktop with keyboard.

Mobile:
- current incompatible-display gate may remain.
- mobile does not need gameplay QA beyond correct blocking.

Do not expand into responsive mobile game this late.

## 5. Full release walkthrough

Run from a clean origin/localStorage.

### Fresh save
1. open production build;
2. system check;
3. fullscreen enter/deny paths;
4. boot;
5. save detected;
6. title;
7. class select;
8. La Muralla;
9. GAME-05 rewards/panels if implemented;
10. GAME-06;
11. boss;
12. PLAYER 2;
13. date gate;
14. choose one date;
15. ending;
16. final save slot.

### Resume
At minimum refresh/reopen at:
- La Muralla;
- after a puzzle;
- after boss;
- after date choice;
- final save slot.

## 6. Three class paths

Do not full-run all content three times manually if automated tests cover
branches.

Manual:
- one full class path end-to-end;
- smoke the class-specific interaction/modifier for the other two.

Automated tests cover class branches.

## 7. Date variants

Seed/test all three dates.

Full manual ending only needs one.

Verify Friday locked.

## 8. Save robustness

Test:
- localStorage unavailable fallback;
- corrupt save backup/recovery;
- old v1 → v2 migration;
- refresh during normal scenes;
- duplicate actions do not duplicate rewards;
- final completed save opens correctly.

Do not intentionally clear Luis's save in normal production flow.

## 9. Production build

Release uses:
`npm run build`

Before deploy:
`npm run check`

CI must be green.

The newly added GitHub workflow runs `npm run check` on PR/push.

## 10. Netlify

Existing config:
- Node 22;
- command npm run build;
- dist publish;
- SPA fallback;
- noindex/noarchive headers;
- immutable Vite assets.

Keep.

Do not deploy from a dirty/uncommitted local workspace.

## 11. Privacy

This is a private personal game.

Required:
- repo remains private;
- noindex/nofollow/noarchive;
- no analytics;
- no third-party tracking;
- no personal chat logs bundled;
- no unneeded EXIF metadata in image assets;
- no secret tokens in repo/build;
- no Google Maps/Street View images copied into runtime assets;
- real-person references only as intentionally included art/content.

## 12. Asset audit

Before release:
- list all production images;
- verify source/ownership notes;
- remove unused huge references from runtime import graph;
- docs reference art may stay in repo but must not ship unless imported;
- verify final sprite transparency;
- check no corrupt JPG is used.

## 13. Network audit

Production game should not need network calls after initial static load.

Open DevTools Network:
- expected Netlify/Vite static files only;
- no unknown trackers;
- no failed API requests;
- no third-party image hosts.

## 14. Console audit

Zero normal-flow:
- errors;
- unhandled rejections;
- React warnings;
- missing asset 404s.

Document any harmless browser warning if unavoidable.

## 15. Fullscreen

Test:
- enter;
- deny;
- unsupported fallback if possible;
- Escape exits;
- game remains usable after exit;
- refresh requires gesture again.

Never try to automate F11.

## 16. Audio

Test:
- first-gesture unlock;
- mute;
- unmute;
- tab background/resume;
- no loud clipping;
- Safari handling;
- game fully playable silent.

## 17. Performance

Use production build.

Targets:
- first interactive quickly on normal broadband;
- no huge image causing multi-second decode;
- stable world animation;
- no runaway CPU on title/saveSlot;
- no leaking AudioNodes/RAF loops after scene changes.

Check at least:
- initial JS gzip size;
- largest raster assets;
- memory/CPU qualitatively during 10+ min play.

## 18. Accessibility

Final manual pass:
- keyboard-only;
- text speed INSTANT;
- reduced motion;
- sound off;
- visible selection;
- disabled date readable;
- puzzle cues not sound-only;
- no focus trap.

## 19. Failure recovery

Production should degrade safely if:
- fullscreen denied;
- audio unavailable;
- an optional asset fails;
- localStorage disabled;
- page resized too small then restored.

Critical runtime asset failure that makes play impossible should produce a
clear in-game/system error with reload suggestion, not a blank page.

## 20. Netlify deploy procedure

1. Merge only after final review.
2. Connect/select the private GitHub repo in Netlify.
3. Production branch = intended default/release branch.
4. Build settings should be read from netlify.toml.
5. Deploy.
6. Open production URL in fresh private/incognito window.
7. Run release smoke.
8. Confirm response headers:
   - X-Robots-Tag
   - Referrer-Policy
   - X-Content-Type-Options
   - Permissions-Policy
9. Confirm robots.txt.
10. Send only after smoke passes.

Do not expose deployment credentials/tokens in repo.

## 21. URL

Prefer a non-embarrassing neutral site slug.

Do not include:
- full legal names;
- relationship/private detail;
- date invitation in URL.

Example style:
`save-slot-02-<random>.netlify.app`

Custom domain is unnecessary.

## 22. Release smoke after deploy

Fresh incognito:
- load;
- fullscreen/window;
- move;
- dialogue;
- one reward;
- one puzzle;
- verify boss scene loads through seeded/dev-safe method if production debug
  methods are unavailable;
- full end-to-end once if time permits;
- final date save;
- refresh.

## 23. Rollback

Before deploy, tag/record the release commit SHA.

If production regression:
- roll back Netlify to last known good deploy;
- fix on branch;
- rerun CI/smoke;
- redeploy.

## 24. Acceptance

GAME-12 passes when:
- CI green;
- production URL deployed;
- release smoke passes;
- critical browser path passes;
- privacy headers verified;
- final link is safe to send.

Then the project is RELEASED.
