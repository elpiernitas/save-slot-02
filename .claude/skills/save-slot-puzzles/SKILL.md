---
name: save-slot-puzzles
description: Use for SAVE SLOT 02 GAME-06 puzzle design/implementation, PuzzleHost, route beacons, seagull microgame, sync terminal, puzzle persistence, hints, or puzzle QA.
---

# SAVE SLOT 02 — Puzzles Skill

## Gate

Implement only after GAME-05 is accepted.

## Read first

- `docs/GAME_06_SPEC.md`
- `docs/PUZZLE_BIBLE.md`
- `docs/GAME_06_CONTENT_FLOW.md`
- `docs/GAME_06_IMPLEMENTATION_ORDER.md`
- `docs/GAME_06_TEST_MATRIX.md`
- `docs/STORY_BIBLE.md`

## Design rule

Puzzles test play/observation, not relationship knowledge.

No private-info trivia.

## Scope rule

Implement:
- ROUTE BEACONS;
- optional SEAGULL PROTOCOL;
- SYNC TERMINAL.

Do not invent five more minigames.

## Runtime rule

Each puzzle gets:
- pure state;
- pure transitions;
- React view;
- tests.

Persist only completion, not every transient move.

## Failure rule

Fast reset.
No game-over.
No punishment.
No mandatory replay after refresh.

## Mystery rule

SYNC TERMINAL reveals only:
`PLAYER 2 — NOT FOUND`

Do not reveal Manu during GAME-06.

## Accessibility

Every puzzle:
- solvable without sound;
- shapes/position as well as colour;
- reduced motion;
- keyboard path;
- Escape/retry behaviour tested.

## Completion rule

Mandatory GAME-06 total puzzle time should remain short.

If a mechanic becomes architecture-heavy, simplify the mechanic instead of
building a framework.
