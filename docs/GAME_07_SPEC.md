# GAME-07 — Boss + PLAYER 2 Reveal

Status: **PREPARED / BLOCKED UNTIL GAME-06 ACCEPTANCE**

GAME-07 is the central reveal phase.

## 1. Product goal

Pay off the "missing second player" mystery with one short, satisfying boss
encounter and reveal Manu as PLAYER 2.

The reveal should feel:
- earned;
- playful;
- mechanically connected to the game;
- specific without becoming sentimental exposition.

It should NOT feel:
- like a relationship slideshow;
- like a breakup/trauma metaphor;
- like a fake villain representing emotional problems;
- like a giant romantic speech;
- like a boss fight inserted only because the roadmap says "boss".

## 2. Narrative setup

GAME-06 ends with:
- PLAYER 1 channel solved;
- PLAYER 2 channel missing;
- fallback route accepted;
- recovery process failing.

GAME-07 begins inside the same system anomaly.

The system tries to reconcile a save that expects two active player channels.

Working boss identity:

**DESYNC PROCESS**

Alternative internal id:
`boss.desync_process`

UI labels can evolve during encounter:
- `DESYNC PROCESS`
- `MISSING INPUT`
- `RECOVERY LOOP`

Do not anthropomorphise it as a jealous/evil entity.

It is a broken system process, not a character with motives.

## 3. Scope

Required:
- one boss scene/arena;
- 2–3 readable mechanical phases;
- class-specific flavour advantage only;
- attempts tracked;
- boss defeat persisted using existing `boss` save state;
- PLAYER 2 reveal scene;
- Manu overworld/portrait integration if approved assets exist;
- one short post-reveal cooperative fiction beat;
- route to GAME-08.

Do not add:
- inventory-heavy boss strategy;
- complex combat stats;
- health bars with damage numbers;
- weapons/equipment;
- long cutscene;
- second-controller support;
- branching reveal identities.

## 4. Boss save model

Existing:

```ts
interface BossState {
  defeated: boolean
  attempts: number
  defeatedAt: IsoTimestamp | null
}
```

Keep shape if possible.

Add reducer actions:

```ts
{ type: 'boss/attempt'; at: string }
{ type: 'boss/defeat'; at: string }
```

Rules:

### boss/attempt
- increments attempts;
- used once when a fresh encounter attempt actually starts;
- reload during same attempt must not spam increments if scene can resume.

### boss/defeat
- first defeat wins;
- sets defeated true;
- sets defeatedAt;
- subsequent defeat is no-op.

No save-version bump.

## 5. Boss architecture

Keep it purpose-built.

Recommended:

```
src/game/boss/
  types.ts
  desync/
    state.ts
    patterns.ts
    DesyncBoss.tsx
    DesyncBoss.css
    content.ts
```

Use pure state/transition logic where useful.

Do NOT build:
- entity-component system;
- combat framework;
- reusable RPG battle engine.

## 6. Encounter format

A dedicated 16:9 game panel/arena is acceptable.

This boss does not need to run in the street world renderer.

Reason:
- distinct system-space visual;
- easier deterministic mechanics;
- preserves world engine simplicity.

Scene id already exists:
`boss`.

## 7. Core mechanic

Use **signal alignment**, not attacking.

PLAYER 1 survives corruption waves while stabilising three signal nodes.

### Arena

- compact central player;
- 3 stabiliser nodes around arena;
- corruption zones telegraphed before activation;
- signal meter/progress shown clearly.

### Controls

- WASD / arrows: move;
- E / Enter: stabilise when near an active node;
- Escape: pause/leave only if safe.

Mouse support optional for boss movement; keyboard is primary.

## 8. Phase structure

### PHASE 1 — CHECKSUM

Duration target: 20–30 s.

Teach:
- telegraphed corruption zones;
- movement;
- one stabiliser node.

System text:
`CHECKSUM MISMATCH`

Goal:
stabilise Node A.

### PHASE 2 — SIGNAL SPLIT

Duration target: 30–45 s.

Two nodes become relevant.

Patterns:
- rotating bars;
- rectangular sweeps;
- pulse zones.

All telegraphed by shape + position, not colour only.

Goal:
stabilise Node B and Node C.

### PHASE 3 — MISSING CHANNEL

Duration target: 20–30 s.

Arena reveals two channels:
- PLAYER 1 — ACTIVE
- PLAYER 2 — NO SIGNAL

PLAYER 1 cannot solve the second channel.

Instead:
- survive one final short pattern;
- interact with central recovery node;
- system attempts external signal recovery.

No fake impossible input sequence.

## 9. Failure

PLAYER 1 has a small integrity meter or strike count.

Recommended:
- 3 strikes;
- hits are forgiving;
- visible recovery window;
- no instant death.

On failure:
- short `SIGNAL LOST`;
- RETRY;
- attempt count increments on new run;
- skip intro dialogue.

Do not show sad/game-over language.

## 10. Class flavour

Class can change one passive convenience/flavour:

### GUERRERO
Stabilise interaction commits slightly faster.

### TANQUE
One extra forgiving hit / shorter stun.

### CURADOR
Recovery after a hit is slightly faster or warning lasts slightly longer.

Keep differences small.

No class should trivialise or hard-lock the fight.

If this adds too much complexity, use flavour-only SYSTEM lines instead.

## 11. Difficulty

First-clear target:
about 2–4 minutes including one failure.

Boss itself should be 90–120 s on a successful run.

No precision-heavy bullet hell.

No frame-perfect timing.

Works at 60/120/144 Hz using delta time.

## 12. Accessibility

Required:
- telegraphs use shape/position;
- no sound-only cues;
- reduced-motion version simplifies moving background/glitch;
- pattern speed remains playable;
- clear contrast;
- no screen shake required;
- pause/settings remain reachable.

Optional:
if repeated failures >=3, offer:
`ASSIST MODE`

Assist may:
- slow patterns 20–25%;
- increase warning duration.

Do not shame player.
Do not disable achievements/rewards.

## 13. Boss visual direction

System-space, but consistent with the game.

Base:
- deep navy;
- cream;
- pale cyan/system green;
- muted coral danger;
- pixel geometry.

Corruption:
- displaced blocks;
- scan breaks used briefly;
- duplicated signal fragments;
- no horror faces;
- no red-black creepypasta aesthetic.

Boss is represented as a process/network shape, not a monster.

## 14. Boss audio

Synth/generated is enough.

Need SFX:
- warning;
- hit;
- node stabilise;
- phase complete;
- recovery scan;
- boss defeat.

Music may remain minimal until GAME-11.

## 15. Defeat transition

After final recovery node:

`DESYNC PROCESS — TERMINATED`

Then:

`SCANNING FOR MISSING INPUT...`

Short pause.

`SIGNAL FOUND`

Do not reveal name immediately on the same frame.

Transition to `player2Reveal`.

## 16. PLAYER 2 reveal

Goal:
recognition, not monologue.

### Suggested sequence

Black/system transition.

`PLAYER SLOT 02`
`IDENTITY DATA RECOVERED`

Silhouette resolves into Manu sprite/portrait.

Then:

`PLAYER 2 — MANU`

One short line from narrator or Manu.

Recommended tone:
- dry;
- self-aware;
- affectionate only underneath.

Example direction, not locked final text:

Narrator:
`Ah. Era eso.`

Manu:
`hola :)`

or a slightly more in-world line:
`Vale. Ya era hora de que me cargara.`

Do not write a paragraph.

## 17. Manu visual canon

Use `CHARACTER_ASSET_SPEC.md`.

- black rectangular glasses;
- dark voluminous hair;
- black hoodie;
- white layer;
- contemporary look.

Portrait/sprite must match existing visual language.

If final Manu asset is not ready:
- do not replace him with a generic anonymous boy;
- use approved ChatGPT reference/silhouette placeholder clearly marked;
- update before release.

## 18. Reveal state

Avoid save-schema change.

Use:
- `boss.defeated`;
- `progress.completedScenes`;
- optional flag `story.player2Found = true`.

Condition for later phases can be:
- bossDefeated;
- flag if exact reveal completion matters.

Do not add `player2` object to save unless GAME-08/09 genuinely needs it.

## 19. Short cooperative fiction beat

After reveal, add one 20–40 second sequence where the game finally has both
player slots.

No second real controller.

Mechanic:
- Manu/PLAYER 2 is AI-scripted;
- Luis activates left switch;
- Manu automatically activates right;
- gate opens.

System:
`2/2 PLAYERS — READY`

This demonstrates why the second slot mattered.

Do not build companion AI.

A scripted movement/animation is enough.

## 20. Rewards

No CITY CARD required for defeating boss.

The reveal itself is the reward.

Optional:
unlock one hidden SYSTEM card only after PLAYER 2 reveal, but this is not
necessary for GAME-07 acceptance.

## 21. Flow

GAME-06:
SYNC TERMINAL failure
→ `boss`
→ boss defeated
→ `player2Reveal`
→ short 2-player gate
→ `dateGate` setup / GAME-08

Do not expose date choice during boss/reveal.

## 22. Tests

Minimum:
- boss/attempt increments;
- boss/defeat first-write-wins;
- bossDefeated condition still works;
- phase state transitions;
- deterministic pattern generation;
- collision/hit/invulnerability;
- stabiliser progress;
- class modifier if implemented;
- assist mode;
- reduced motion;
- retry;
- defeat → reveal;
- refresh after defeat skips boss;
- reveal state persists;
- two-player scripted gate cannot deadlock.

## 23. QA

Required:
- one successful full run;
- one failure + retry;
- all three classes or targeted class modifier tests;
- reduced motion;
- 1366×768;
- 144 Hz simulation/headless timing if practical;
- refresh after boss defeat;
- reveal screenshot;
- two-player gate screenshot.

## 24. Acceptance

GAME-07 passes only when:
- boss feels like a game mechanic, not a metaphor lecture;
- successful run is short;
- failure is forgiving;
- PLAYER 2 reveal is recognisable and restrained;
- no date reveal yet;
- no sentimental monologue;
- route to GAME-08 is stable.

## 25. NEXT

**GAME-08 — date portals / real-world choice**

Do not start GAME-08 inside GAME-07.
