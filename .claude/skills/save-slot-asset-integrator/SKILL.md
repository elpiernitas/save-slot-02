---
name: save-slot-asset-integrator
description: Use when importing, replacing, slicing, manifesting, positioning, or wiring visual assets for SAVE SLOT 02.
---

# SAVE SLOT 02 — Asset Integrator Skill

## Objective

Convert approved/reference visual material into stable runtime assets without
changing game rules or inventing a new visual direction.

## Before editing

Read:
1. `docs/ASSET_MANIFEST_V2.md`
2. `docs/ASSET_IMPORT_CONTRACT.md`
3. `docs/GAME_04R_VISUAL_REBUILD.md`
4. `.claude/skills/save-slot-visual/SKILL.md`

## Workflow

### 1. Classify input

For every image decide:
- REFERENCE_ONLY;
- RUNTIME_READY;
- NEEDS_CLEANUP;
- PLACEHOLDER.

Record the decision in the asset manifest or ASSETS doc.

### 2. Never infer game logic from concept-art text

Concept art may contain illustrative menus, stats, labels and dialogue.

Only implement behavior explicitly supported by product docs/source code.

Example:
a class-selection illustration may show numerical stats.
Do not add stats unless GAME-03 product rules approve them.

### 3. Runtime preparation

For environment art:
- crop/resize intentionally;
- preserve a consistent camera;
- remove baked functional characters;
- use foreground layer only when it materially improves occlusion.

For sprite sheets:
- ensure a predictable grid;
- normalize frame dimensions;
- use transparent background;
- define anchor at feet;
- define collision separately;
- nearest-neighbour scaling at runtime.

### 4. Image cleanup

Allowed:
- crop;
- pad;
- remove empty margins;
- resize using nearest-neighbour for true sprite art;
- resize using high-quality resampling for painterly reference before manual
  pixel cleanup;
- split sheets;
- compose transparent layers.

Avoid:
- aggressive automatic tracing;
- reducing a detailed concept directly to a tiny sprite and calling it final;
- leaving halos/opaque backgrounds around sprites.

### 5. Manifests

Character manifest:
```json
{
  "frameWidth": 32,
  "frameHeight": 48,
  "anchor": { "x": 16, "y": 45 },
  "collision": { "x": 9, "y": 34, "width": 14, "height": 10 },
  "animations": {}
}
```

Use actual dimensions after preparation; numbers above are examples.

### 6. Integration test

For every new runtime asset verify:
- file decodes;
- expected dimensions;
- manifest frames fit;
- renderer uses image smoothing = false where appropriate;
- missing asset fails gracefully in dev;
- collisions still align visually.

### 7. Visual QA over unit-test worship

Tests ensure stability. Screenshots decide whether art works.

If tests pass but the scene looks wrong, the task is not done.

## External image generation

Claude Code is not required to generate final images.

If image generation is unavailable:
- keep implementing the loader/layout with replaceable placeholders;
- do not use paid connectors without approval;
- do not recreate the full image procedurally.

ChatGPT can supply new reference/art assets between implementation passes.
