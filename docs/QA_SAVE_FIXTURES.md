# SAVE SLOT 02 — QA Save Fixtures

Status: specification for tests/dev-only seeding.

Purpose:
allow late-phase QA without replaying the entire game for every screenshot.

These fixtures must never create production-visible cheat controls.

## Implementation recommendation

Create pure test/dev fixture helpers only:

`src/game/testing/saveFixtures.ts`

Base every fixture on `createInitialSave(fixedNow)`, then apply real reducer
actions where practical.

Do not hand-write giant JSON blobs that drift from save migrations.

Expose to browser only in DEV if Claude needs automated screenshots.

Production build must not expose fixture controls.

## FIXTURE-00 fresh

- no class
- no progress
- no cards/items
- no boss/date/completion

Use for full boot.

## FIXTURE-04R muralla

- boot completed
- entered game
- class = tank (default visual QA choice)
- resume = overworld
- checkpoint = muralla:arrival

Variants:
- warrior
- healer

## FIXTURE-05 rewards

- GAME-04R state
- first two CITY CARDS owned
- one unseen, one seen
- optional COASTER item

Use inventory/binder QA.

## FIXTURE-06 puzzles

- GAME-05 state
- route puzzle incomplete
- no boss

Variants:
- PZ-01 complete
- all GAME-06 mandatory puzzles complete

## FIXTURE-07 boss

- GAME-06 complete
- boss undefeated
- class variants

Separate:
- boss defeated
- player2 reveal not yet completed
- player2 found

## FIXTURE-08 date gate

- boss defeated
- PLAYER 2 found
- no chosen date

Use fixed clocks:
- 2026-09-28 Madrid
- 2026-10-01 Madrid
- 2026-10-05 Madrid

## FIXTURE-09 completed

Three variants:
- wed chosen
- thu chosen
- sun chosen

All:
- completedAt set
- saveSlot resume

## Rules

Fixtures:
- deterministic timestamps;
- no random UUIDs;
- validated by same save normaliser;
- tests assert fixture is loadable;
- never alter production default save.
