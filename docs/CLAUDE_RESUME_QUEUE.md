# CLAUDE RESUME QUEUE

Status: read this when a Claude Code session resumes.

## First action

Do not implement prepared future phases yet.

Inspect the latest branch and PR comments.

Current active milestone:
**GAME-04R**

Read:
- docs/AI_COLLABORATION.md
- docs/RELEASE_CRITICAL_PATH.md
- docs/GAME_04R_EXECUTION_ORDER.md
- docs/GAME_04R_VISUAL_REBUILD.md
- docs/GAME_04R_LAYOUT_SPEC.md
- docs/ASSET_MANIFEST_V2.md
- docs/ASSET_IMPORT_CONTRACT.md
- docs/UI_SYSTEM_V2.md
- docs/CHARACTER_ASSET_SPEC.md
- .claude/skills/save-slot-visual/SKILL.md
- .claude/skills/save-slot-asset-integrator/SKILL.md

Visual references:
- docs/art/chatgpt-v2/visual-bible.jpg
- docs/art/chatgpt-v2/ui-reference-board.jpg
- docs/art/chatgpt-v2/ui-flow-storyboard.jpg

## Execute now

Integrate GAME-04R.

Do not merely prepare more docs.

Return:
- commit;
- six screenshots;
- tests/check;
- remaining placeholders.

Then wait for ChatGPT review on the PR.

## Future queue already prepared

After ACCEPT:
- GAME-05:
  docs/GAME_05_IMPLEMENTATION_ORDER.md
- GAME-06:
  docs/GAME_06_IMPLEMENTATION_ORDER.md
- GAME-07:
  docs/GAME_07_IMPLEMENTATION_ORDER.md
- GAME-08:
  docs/GAME_08_IMPLEMENTATION_ORDER.md
- GAME-09:
  docs/GAME_09_IMPLEMENTATION_ORDER.md
- GAME-10:
  optional/cuttable
- GAME-11:
  docs/GAME_11_SPEC.md
- GAME-12:
  docs/GAME_12_RELEASE_SPEC.md

## CI

A GitHub Actions workflow now runs `npm run check`.

Treat CI red as a blocker before handing a milestone back.

## Communication

Use PR #1 as ChatGPT ↔ Claude channel.

If blocked by a meaningful creative decision:
comment there.

Do not ask Manu routine implementation questions.

No merge until release review.
