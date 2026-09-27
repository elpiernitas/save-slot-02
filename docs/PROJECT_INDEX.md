# SAVE SLOT 02 — Project Index

Use this file to avoid reading the repository as an undifferentiated pile of
documents.

## 1. Always read

1. `docs/HANDOFF.md`
2. `docs/RELEASE_CRITICAL_PATH.md`
3. `docs/AI_COLLABORATION.md`
4. `docs/GAME_CONSTITUTION.md`
5. `docs/WORLD_BIBLE.md`
6. `docs/STORY_BIBLE.md`
7. `docs/DECISION_LOG.md`

## 2. Current active milestone

**GAME-04R**

Read:
- `GAME_04R_VISUAL_REBUILD.md`
- `GAME_04R_EXECUTION_ORDER.md`
- `GAME_04R_LAYOUT_SPEC.md`
- `ASSET_IMPORT_CONTRACT.md`
- `ASSET_MANIFEST_V2.md`
- `ART_DIRECTION_V1.md`
- `UI_SYSTEM_V2.md`
- `CHARACTER_ASSET_SPEC.md`

Visual:
- `docs/art/chatgpt-v2/visual-bible.jpg`
- `docs/art/chatgpt-v2/ui-reference-board.jpg`
- `docs/art/chatgpt-v2/ui-flow-storyboard.jpg`

Skills:
- `.claude/skills/save-slot-game-director/SKILL.md`
- `.claude/skills/save-slot-visual/SKILL.md`
- `.claude/skills/save-slot-asset-integrator/SKILL.md`

## 3. Prepared future phases

### GAME-05
- `GAME_05_SPEC.md`
- `CITY_CARDS_BIBLE.md`
- `GAME_05_UI_SPEC.md`
- `GAME_05_TEST_MATRIX.md`
- `GAME_05_IMPLEMENTATION_ORDER.md`
- skill: `save-slot-inventory-cards`

### GAME-06
- `GAME_06_SPEC.md`
- `PUZZLE_BIBLE.md`
- `GAME_06_CONTENT_FLOW.md`
- `GAME_06_TEST_MATRIX.md`
- `GAME_06_IMPLEMENTATION_ORDER.md`
- skill: `save-slot-puzzles`

### GAME-07
- `GAME_07_SPEC.md`
- `DESYNC_BOSS_BIBLE.md`
- `GAME_07_BOSS_PATTERN_SPEC.md`
- `GAME_07_PLAYER2_REVEAL.md`
- `GAME_07_REVEAL_UI_SPEC.md`
- `GAME_07_ASSET_REQUESTS.md`
- `GAME_07_SCOPE_CUT.md`
- `GAME_07_TECHNICAL_CONTRACT.md`
- `GAME_07_COPY.md`
- `GAME_07_TEST_MATRIX.md`
- `GAME_07_IMPLEMENTATION_ORDER.md`
- skill: `save-slot-boss-player2`

### GAME-08
- `GAME_08_SPEC.md`
- `GAME_08_COPY.md`
- `GAME_08_TEST_MATRIX.md`
- `GAME_08_IMPLEMENTATION_ORDER.md`
- skill: `save-slot-date-gate`

### GAME-09
- `GAME_09_SPEC.md`
- `FINAL_SAVE_SLOT_UI.md`
- `GAME_09_TEST_MATRIX.md`
- `GAME_09_IMPLEMENTATION_ORDER.md`
- skill: `save-slot-ending`

### GAME-10
- `GAME_10_SPEC.md`
- `GAME_10_TEST_MATRIX.md`
- `GAME_10_IMPLEMENTATION_ORDER.md`
- skill: `save-slot-postgame`

### GAME-11
- `GAME_11_SPEC.md`
- `OST_DIRECTION.md`
- `GAME_11_POLISH_CHECKLIST.md`
- `GAME_11_TEST_MATRIX.md`
- skill: `save-slot-polish-audio`

### GAME-12
- `GAME_12_RELEASE_SPEC.md`
- `RELEASE_QA_MATRIX.md`
- `NETLIFY_RELEASE.md`
- `RELEASE_CHECKLIST.md`
- `RELEASE_RISK_REGISTER.md`
- `QA_SAVE_FIXTURES.md`
- skill: `save-slot-release`

## 4. Planning/backlog

These are non-authoritative idea pools until promoted into a phase spec:
- `CONTENT_BACKLOG.md`
- `VISUAL_PRODUCTION_BACKLOG.md`

## 5. Asset docs

- `ASSETS.md` — actual sources/licences/runtime asset log
- `ASSET_MANIFEST_V2.md` — intended production/reference mapping
- `ASSET_IMPORT_CONTRACT.md` — integration rules

## 6. Technical entry points

- `src/game/state/` — save/reducer/conditions
- `src/game/dialogue/` — dialogue runtime/UI
- `src/game/world/` — exploration engine
- `src/game/input/` — shared input router
- `src/game/calendar/` — real dates/time gates
- `src/game/audio/` — audio contract/Web Audio
- `src/game/scenes/` — top-level flow

## 7. Rule for conflicts

Priority:
1. current phase spec;
2. GAME_CONSTITUTION;
3. WORLD_BIBLE / STORY_BIBLE;
4. DECISION_LOG;
5. backlog/examples.

For appearance:
latest approved visual references + current visual spec win.

For behaviour:
product/spec docs + source contracts win over concept-art text.
