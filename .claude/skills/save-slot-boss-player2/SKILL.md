---
name: save-slot-boss-player2
description: Use for SAVE SLOT 02 GAME-07 DESYNC PROCESS boss, boss persistence, assist mode, PLAYER 2 reveal, Manu integration, or cooperative reveal sequence.
---

# SAVE SLOT 02 — Boss + PLAYER 2 Skill

## Gate
Implement only after GAME-06 ACCEPT.

## Read
- docs/GAME_07_SPEC.md
- docs/DESYNC_BOSS_BIBLE.md
- docs/GAME_07_PLAYER2_REVEAL.md
- docs/GAME_07_IMPLEMENTATION_ORDER.md
- docs/GAME_07_TEST_MATRIX.md
- docs/CHARACTER_ASSET_SPEC.md

## Boss rule
DESYNC PROCESS is a broken synchronisation process, not a relationship
metaphor.

## Scope
One short deterministic boss.
No combat framework.
No stats/equipment.
No weapons.

## Difficulty
Readable telegraphs.
Forgiving.
Assist after repeated failures.

## Reveal
PLAYER 2 is Manu.
Recognition first.
One short line.
No romantic monologue.
No date choice yet.

## Persistence
Use existing boss save shape.
Use a minimal flag for reveal only if required.
Avoid schema expansion.

## Visual
System-space, navy/cyan/cream/coral.
No horror/glitch overload.

## Handoff
End GAME-07 with final side-quest data recovered and route to GAME-08.
Do not implement GAME-08.
