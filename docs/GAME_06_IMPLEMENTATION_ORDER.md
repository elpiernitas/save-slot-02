# GAME-06 — Implementation Order

Status: READY FOR CLAUDE AFTER GAME-05 ACCEPT.

## 0. Preconditions

- GAME-04R visually accepted.
- GAME-05 accepted.
- Read:
  - `GAME_06_SPEC.md`
  - `PUZZLE_BIBLE.md`
  - `GAME_06_CONTENT_FLOW.md`
  - `UI_SYSTEM_V2.md`
  - `STORY_BIBLE.md`

## 1. Puzzle core

Add:
- puzzle static types/registry;
- reducer action `puzzle/complete`;
- condition `puzzleCompleted`;
- tests.

Do not persist transient runtime state.

## 2. PuzzleHost

Create the smallest reusable host needed for:
- input capture;
- pause world;
- retry;
- completion callback;
- Escape behaviour;
- reduced motion.

Do not create a generic plugin ecosystem.

## 3. Multi-map exploration, only if needed

If Cholo is a second map:
- add map registry;
- select map from checkpoint prefix;
- implement clean transition;
- preserve `overworld` as top-level scene;
- test teardown/recreate.

## 4. Cholo area

Create a compact playable node.

Do not build full Gijón.

## 5. PZ-01 ROUTE BEACONS

Implement pure state + world bindings + hints.

Test wrong/reset/success.

## 6. Optional MG-01 SEAGULL PROTOCOL

Implement deterministic warning pattern.

Test fail/retry/leave/clear.

First-clear reward only.

## 7. PZ-02 SYNC TERMINAL

Implement pure rotate/connect state.

Then narrative missing PLAYER 2 check.

No Manu reveal.

## 8. Reward wiring

Use GAME-05 systems.

No duplicate card grants.

## 9. End transition

Set minimal missing-player state and route to GAME-07 setup.

Do not implement boss.

## 10. QA

Run complete sequence at:
- 1920×1080;
- 1440×900;
- 1366×768.

Verify:
- keyboard;
- mouse where relevant;
- reduced motion;
- refresh;
- world pause/resume;
- optional skip;
- no console errors.

## 11. Docs

Update:
- HANDOFF;
- ROADMAP;
- DECISION_LOG;
- ASSETS;
- puzzle docs if implementation differs.

## 12. Final response

GAME-06 STATUS

PUZZLE ARCHITECTURE
WORLD TRANSITION
ROUTE BEACONS
SEAGULL PROTOCOL
SYNC TERMINAL
PLAYER 2 FORESHADOWING
REWARDS
SAVE
TESTS
VALIDATION
VISUAL QA
FILES
NEXT

NEXT:
**GAME-07 — boss + PLAYER 2 reveal**

Do not start GAME-07.
