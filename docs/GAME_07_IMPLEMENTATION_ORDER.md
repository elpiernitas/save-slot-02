# GAME-07 — Implementation Order

Status: READY AFTER GAME-06 ACCEPT.

## 0. Read
- GAME_07_SPEC
- DESYNC_BOSS_BIBLE
- GAME_07_PLAYER2_REVEAL
- CHARACTER_ASSET_SPEC
- STORY_BIBLE
- UI_SYSTEM_V2

## 1. Boss save actions
Implement boss/attempt + boss/defeat.
No save version bump.

## 2. Boss pure state
Implement encounter phases, hazards, strikes, stabiliser nodes and assist
modifier as deterministic/pure logic where practical.

## 3. Boss scene
Use existing `boss` scene id.
Dedicated system arena.
Keyboard-first.

## 4. Retry/assist
Fast retry.
Offer assist after repeated failure.

## 5. Defeat
Persist defeat before transition.
Refresh must not replay boss.

## 6. PLAYER 2 reveal
Use `player2Reveal` scene.
Integrate approved Manu art.
Keep dialogue short.

## 7. Story state
Set minimal persistent flag only if required.
Do not add large player2 save schema.

## 8. Cooperative fiction beat
Script Manu movement/action.
No companion AI framework.

## 9. Route
End on GAME-08 setup.
Do not implement date selection.

## 10. Tests + QA
Follow GAME_07_TEST_MATRIX.

## 11. Docs
Update HANDOFF / ROADMAP / DECISION_LOG / ASSETS.

## NEXT
GAME-08 only after review.
