# GAME-06 — Puzzles / Minigames

Status: **PREPARED / BLOCKED UNTIL GAME-05 ACCEPTANCE**

This is the functional contract for GAME-06.

## 1. Product goal

Add a short sequence of genuinely playable challenges that makes SAVE SLOT 02
feel like a game rather than an interactive story.

Luis plays a lot of games, so puzzles should:
- start quickly;
- explain themselves through play;
- avoid long tutorials;
- be readable on first contact;
- allow a fast reset;
- never punish experimentation;
- stay original and small.

GAME-06 should also advance the mystery:
the save appears to expect **two players**, but PLAYER 2 is still missing.

## 2. Scope

Required:
1. one small new Gijón area or equivalent exploration beat;
2. one environmental/route puzzle;
3. one short system puzzle that reveals the missing second input;
4. one optional micro-minigame;
5. generic puzzle runtime/host only as far as these three challenges need;
6. persistent completion;
7. attempts tracked at completion;
8. rewards using GAME-05 inventory/CITY CARDS;
9. keyboard + mouse where appropriate;
10. visual/browser QA.

Do not build a universal puzzle engine for hypothetical future games.

## 3. Proposed flow

### Beat A — leave La Muralla

After GAME-05 has taught inventory/cards, the unidentified side quest updates.

SYSTEM:
`ROUTE DATA RECOVERED: 18%`

A new route becomes available.

Preferred next area:
**Cimavilla / Cuesta del Cholo — afternoon moving toward sunset.**

This is a compressed playable node, not a literal map.

### Beat B — PZ-01 ROUTE BEACONS

Luis must activate three small city beacons in the correct sequence.

The sequence is communicated environmentally / visually, not by a paragraph.

### Beat C — optional MG-01 SEAGULL PROTOCOL

A ridiculous optional microgame:
survive a short seagull/snack incident.

Reward:
CITY CARD `SEAGULL WITH INTENT`.

### Beat D — PZ-02 SYNC TERMINAL

A system terminal/gate requests two input channels.

Luis can solve the PLAYER 1 side.

The PLAYER 2 side remains unavailable.

The system accepts a degraded fallback, marks the puzzle complete, then emits
a corrupted quest signal that leads directly toward GAME-07.

End beat:
`PLAYER SLOT 02 — SIGNAL REQUIRED`
then
`RECOVERY PROCESS FAILED`

GAME-07 begins from this anomaly.

## 4. Puzzle persistence

Existing save:
```ts
puzzles: Record<PuzzleId, PuzzleResult>
```

Existing:
```ts
interface PuzzleResult {
  completedAt: IsoTimestamp
  attempts: number
}
```

Keep this shape if possible.

### Important decision

Do **not** persist every failed attempt.

Attempts can live in puzzle runtime state while playing.

On completion:
```
puzzle/complete
- id
- attempts
- at
```

Reducer:
- first completion wins;
- stores completedAt and total attempts for that completed session;
- subsequent completion action = no-op.

No save-version bump required.

## 5. Condition

Add:

```ts
{ kind: 'puzzleCompleted'; puzzle: PuzzleId }
```

This is useful for:
- dialogue branches;
- world transitions;
- future quest flow.

Do not add generic numerical puzzle-score conditions.

## 6. Puzzle definitions

Create static content contract:

```ts
type PuzzleKind = 'routeSequence' | 'syncGrid' | 'microgame'

interface PuzzleDefinition {
  id: PuzzleId
  title: string
  kind: PuzzleKind
  optional: boolean
  estimatedSeconds: number
}
```

Puzzle implementation state should live in each puzzle module, not inside this
definition.

## 7. Runtime architecture

Preferred:

```
src/game/puzzles/
  types.ts
  registry.ts
  PuzzleHost.tsx
  puzzleState.ts (shared helpers only if useful)
  routeBeacons/
  syncTerminal/
  seagullProtocol/
```

Each puzzle has:
- pure state type;
- pure reducer/transition function;
- solved/completion selector;
- reset;
- React view;
- content/config data;
- tests.

Do not create a plugin framework.

## 8. UI presentation

Puzzles may be:
- embedded in the world;
- React overlay;
- dedicated game panel.

World must pause whenever a puzzle overlay owns input.

Use the same navy/cream visual language from `UI_SYSTEM_V2.md`.

SYSTEM-style puzzles may use pale cyan/green accents.

## 9. PZ-01 — ROUTE BEACONS

### Fantasy

Three ordinary urban points are being treated as route-calibration beacons.

Examples:
- a lamp;
- a viewpoint marker;
- a terrace-side post.

The game briefly pulses their symbols in order.

Luis then walks between them and activates them.

### Controls

World movement remains normal.

At an active beacon:
`E / ENTER — SYNC`

### Sequence

Use exactly 3 beacons.

First view:
- a 3-symbol pulse is shown once;
- symbols remain identifiable in environment;
- player can request replay through an interactable/system prompt.

No audio-only clue.

### Failure

Wrong beacon:
- sequence resets;
- short dry SYSTEM line;
- attempt count +1 in runtime;
- no penalty.

### Success

After all three:
`ROUTE SYNC — OK`

Grant:
- one modest reward, e.g. CITY CARD `AFTERNOON IN CIMAVILLA` or a route key.

Do not give multiple rewards.

### Class variation

Class can alter one line only.

No class gets a different/easier solution.

## 10. MG-01 — SEAGULL PROTOCOL (optional)

### Goal

Survive approximately 12–15 seconds inside a small movement area.

### Mechanic

- 2–3 warning markers appear on ground;
- after a readable delay, a seagull dive/hit zone resolves;
- player moves out of it;
- 4–6 total attacks;
- deterministic seeded pattern for tests;
- hit does not kill; it reduces the current streak / restarts the short run.

### Accessibility

- visual warning always present;
- sound optional;
- reduced motion uses static warning flashes instead of aggressive movement;
- no rapid button mashing.

### Reward

On first clear:
CITY CARD `SEAGULL WITH INTENT`.

Optional game means:
- it cannot block story;
- failure returns cleanly to exploration;
- skip/leave available.

## 11. PZ-02 — SYNC TERMINAL

### Purpose

Mechanically foreshadow PLAYER 2 without revealing Manu.

### Presentation

A compact two-channel terminal:
- left = PLAYER 1;
- right = PLAYER 2.

Luis solves the left channel.

The right channel is visibly inactive, not a fake choice.

### Mechanic

Use a tiny connection/rotation puzzle:
- 3 nodes or tiles;
- rotate/select each to connect source → output;
- all states discrete;
- no physics;
- target readable.

Keyboard:
- arrows/WASD move cursor;
- Enter/Space rotate/confirm;
- Escape exits only before final lock.

Mouse:
- hover/click.

### After PLAYER 1 solved

System checks right side.

`PLAYER 2 INPUT........ NOT FOUND`

Pause.

Then:
`FALLBACK ROUTE AVAILABLE`

One final confirm applies fallback.

Puzzle completes normally.

### Narrative output

Set only the minimum needed state:
- puzzle completion;
- a flag such as `system.player2SignalMissing = true` if content needs it.

Then route to the setup for GAME-07.

Do not identify Manu.

## 12. World expansion

If GAME-06 adds Cuesta del Cholo, generalise exploration just enough for
multiple maps.

Current checkpoint format already includes map id:
`muralla:<spawn>`.

Preferred work:
- create a world-map registry;
- parse checkpoint prefix → map;
- allow explicit area transition;
- keep `overworld` as the top-level React scene;
- do not add a separate React scene per street.

Suggested:
```
src/game/world/maps/index.ts
src/game/world/transition.ts
```

A transition should:
- choose target map;
- choose target spawn;
- save checkpoint;
- recreate/rebind engine cleanly;
- avoid save-schema changes.

If art scope makes a second full area too expensive, a compact Cholo node is
acceptable. Do not build all of Gijón.

## 13. Puzzle completion action

Add:
```ts
{ type: 'puzzle/complete'; puzzle: PuzzleId; attempts: number; at: string }
```

Rules:
- attempts minimum 1;
- first completion wins;
- no overwrite of completedAt/attempts;
- touch timestamps only on actual change.

Do not persist transient puzzle state.

## 14. Quest interaction

GAME-06 may start using the quest model if useful, but avoid building the full
quest-log UI unless needed.

Minimal acceptable:
- SYSTEM objective text;
- flags/puzzle completion determine route.

If `setQuest` becomes necessary for clean dialogue flow, implement it
properly. Otherwise leave it for a later dedicated quest pass.

## 15. Rewards

GAME-06 can use GAME-05 systems.

Recommended:
- PZ-01 → one CITY CARD/event or key.
- MG-01 → SEAGULL card.
- PZ-02 → no collectible reward; its narrative consequence is enough.

Do not turn every puzzle into a loot chest.

## 16. Failure / restart UX

All puzzles:
- immediate retry;
- no long intro replay;
- no loss of items/cards;
- no game-over screen;
- no permanently missable content.

Optional minigame:
- LEAVE option available.

## 17. Visual direction

### Cholo
- recognisable coastal urban viewpoint;
- afternoon/sunset;
- stone wall/railing only where location actually has one;
- city/coast depth;
- people sitting/standing;
- not empty postcard scenery.

### System terminal
- clean retro system layer;
- same UI family;
- not horror;
- subtle glitch only after PLAYER 2 check fails.

## 18. Audio

Use synthesized SFX:
- beacon sync;
- wrong/reset;
- puzzle complete;
- seagull warning;
- terminal rotation;
- terminal error.

No external audio required.

## 19. Tests

Minimum:
- pure puzzle state transitions;
- deterministic seagull sequence;
- route-beacon success/failure/reset;
- sync-terminal rotations and solved state;
- puzzle/complete reducer;
- puzzleCompleted condition;
- duplicate completion no-op;
- world paused during overlay puzzle;
- input layer priority;
- leave/retry;
- map transition + checkpoint if second area added;
- rewards only once;
- refresh after completion.

## 20. QA

Desktop:
- 1920×1080;
- 1440×900;
- 1366×768.

Run:
1. PZ-01 wrong sequence then success.
2. MG-01 fail once then clear or leave.
3. PZ-02 full solve.
4. Refresh between puzzles.
5. Complete same puzzle again through dev tools; no duplicate reward/state.

No scroll.
No console errors.
No stuck movement after overlay closes.

## 21. Acceptance

GAME-06 passes when:
- the required puzzles are understandable without a manual;
- total mandatory puzzle time is roughly 4–8 minutes;
- optional microgame is genuinely optional;
- no relationship trivia;
- second-player mystery is advanced clearly;
- no puzzle feels like filler;
- previous systems remain stable.

## 22. NEXT

**GAME-07 — boss + PLAYER 2 reveal**

Do not start GAME-07 inside GAME-06.
