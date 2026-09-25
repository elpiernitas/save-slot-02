# GAME-11 — Audio, Animation, Easter Eggs + Polish

Status: **PREPARED / CORE-POLISH PHASE**

GAME-11 is the final quality pass before production QA.

## 1. Product goal

Make the game feel intentionally finished:
- coherent audio;
- small responsive animations;
- consistent UI;
- no obvious placeholders;
- a few rewarding easter eggs;
- no scope explosion.

## 2. Priority tiers

### P0 — must ship
- real music path behind existing AudioEngine;
- expanded SFX vocabulary;
- scene music switching;
- consistent UI animation/reduced-motion;
- remove debug visuals/placeholders;
- visual consistency pass;
- loading/error fallbacks;
- final copy polish.

### P1 — ship if stable
- 3–5 achievements/easter eggs;
- Randy cameo;
- subtle ambient world animation;
- card holo sheen;
- class-specific tiny polish.

### P2 — cut first
- elaborate secret rooms;
- many achievements;
- multiple music tracks per location;
- complex ambient NPC schedules.

## 3. Audio architecture

Existing `AudioEngine` contract stays.

Current `createWebAudioEngine` already supports:
- unlock;
- settings;
- SFX;
- voice blips;
- playMusic/stopMusic stubs.

Implement music without changing caller API.

## 4. Music strategy

No commercial audio.

Preferred:
**procedural / tracker-like Web Audio score**.

Why:
- no licensing risk;
- tiny bundle;
- deterministic;
- fits pixel-indie style;
- existing WebAudio engine.

Do not try to imitate a specific copyrighted song.

### Music engine

Add a small scheduler:
- one AudioContext;
- lookahead scheduling;
- looped step patterns;
- gain per music channel;
- crossfade/fade-out;
- stop cleans scheduled nodes.

Avoid:
- one oscillator per animation frame;
- drift based only on setInterval;
- leaking nodes after scene changes.

## 5. Original motif

Create one simple original motif of 4–6 notes.

Transform it by context, rather than composing many unrelated songs.

### Tracks

P0 minimum:

`system`
- sparse;
- low pulse;
- boot/title/system spaces.

`muralla_afternoon`
- warm pluck/triangle;
- light bass;
- restrained groove.

`puzzle`
- slightly more rhythmic;
- same motif fragmented.

`desync`
- tense syncopation;
- no horror.

`ending`
- slow clean motif;
- warm and short.

If GAME-06 includes Cholo:
`cholo_sunset` can be a P1 variation.

## 6. Sound effects

Extend `SYNTH_SFX`.

Needed:
- cursor
- confirm
- cancel
- boot
- interact
- itemGet
- cardGet
- puzzleCorrect
- puzzleWrong
- puzzleComplete
- warning
- hit
- bossNode
- bossDefeat
- save
- gateLocked
- gateOpen

Keep levels conservative.

No harsh square-wave fatigue.

## 7. Voice blips

Keep generated blips.

Add voice ids only for characters actually speaking:
- system
- narrator
- Luis if needed
- Manu
- generic NPC

Avoid making every character cartoonishly different.

## 8. Music routing

Create central mapping from game context/scene to track.

Do not call `playMusic` ad hoc in many components.

Suggested:
```
musicForScene(sceneId, worldMapId?)
```

Rules:
- startup/title → system
- overworld muralla → muralla_afternoon
- puzzle overlay → optionally puzzle without restarting every open/close
- boss → desync
- reveal/ending → ending

Use fade 200–600 ms.

## 9. Muting/settings

Existing settings remain authoritative.

Verify:
- mute stops audible output promptly;
- unmute resumes future playback cleanly;
- volume sliders/settings affect active music if applicable;
- refresh keeps settings.

Do not add autoplay before unlock.

## 10. Animation polish

### World
P0:
- player walk already exists;
- subtle tree/umbrella/lighting only if cheap;
- interaction prompt fade;
- no excessive bobbing.

P1:
- seagull idle;
- one ambient NPC movement;
- water/coast shimmer later areas.

### UI
- panel in/out;
- cursor;
- acquisition overlay;
- card sheen;
- save pulse;
- boss telegraphs;
- reveal silhouette resolve.

Everything respects reduced motion.

## 11. Scene transitions

Create/standardise a small set:
- fade;
- system wipe;
- save-slot resolve.

Do not create unique transition for every scene.

Avoid long transitions >500–700 ms in normal gameplay.

## 12. Placeholder purge

Before GAME-12, search for:
- `TODO`
- `placeholder`
- `AREA NOT GENERATED`
- dev-only labels
- temporary art ids
- debug handles in production
- Archivero references in canon flow
- broken image refs
- console warnings

Every remaining placeholder must be:
- explicitly dev-only; or
- intentionally invisible to player.

## 13. Copy polish

Review every visible string.

Rules:
- SYSTEM English retro;
- dialogue Spanish;
- consistent punctuation;
- no accidental English narrator copy;
- no overlong pages;
- no "romantic app" wording;
- no debug terminology.

## 14. Achievements

P1 only.

Keep 3–5.

Examples:
- `FIRST SYNC` — first puzzle complete.
- `UNMOVED OBJECT` — bollard interaction.
- `NO SNACKS WERE HARMED` — seagull microgame.
- `SECOND SLOT` — PLAYER 2 reveal.
- hidden one for an optional interaction.

Achievements are tiny toasts/records, not a separate grind system.

No score.

## 15. Easter eggs

Use only references already approved.

Candidates:
- giant-game-library joke;
- block-building-game oblique line;
- old-card-collection reference;
- Club Penguin-level nostalgia joke without copyrighted art;
- tarot Three of Swords reversed as one tiny optional visual/reference;
- Randy cameo.

Do not name/depict third-party IP prominently.

One-line easter eggs are enough.

## 16. Randy

If not used in GAME-10:
place one optional Randy cameo in a later safe area or final save slot.

No story key.

## 17. Performance

Targets:
- stable on 1366×768 laptop;
- no unbounded RAF/audio work;
- no giant source images loaded unnecessarily;
- no unnecessary React rerenders every world frame;
- preload only assets needed for next scene where useful.

Measure:
- production bundle;
- initial load;
- major asset sizes.

Do not chase arbitrary micro-optimisation if stable.

## 18. Error handling

Production should not softlock when:
- image fails;
- audio unsupported;
- fullscreen denied;
- localStorage unavailable/corrupt;
- browser tab loses focus.

Existing graceful save/audio/fullscreen behaviour must remain.

For failed visual asset:
- dev: clear console error;
- production: safe fallback rather than blank stage where possible.

## 19. Accessibility final pass

Verify:
- keyboard-only complete run;
- mouse where supported;
- reduced motion;
- sound off;
- text speed instant;
- contrast;
- no sound-only puzzle info;
- focus/input layers never trap.

## 20. Tests

Add tests around:
- music routing;
- scheduler cleanup;
- mute;
- scene transitions if logic extracted;
- reduced-motion timing;
- achievement first unlock;
- no production dev handles;
- placeholder registry validation.

Do not attempt unit tests for subjective visual polish.

## 21. Visual/audio QA

Run a full successful playthrough in production build.

Record:
- console;
- scene music transitions;
- SFX clipping;
- input;
- pauses;
- refresh at critical points;
- reduced motion;
- muted run.

## 22. Acceptance

GAME-11 passes when:
- no obvious placeholder remains in normal flow;
- audio makes the game feel more alive without being annoying;
- reduced-motion/mute are first-class;
- visuals feel coherent;
- core bundle/performance remains healthy;
- no P2 polish blocks release.

## 23. NEXT

**GAME-12 — production QA + Netlify**
