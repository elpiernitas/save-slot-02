---
name: save-slot-visual
description: Visual integration skill for SAVE SLOT 02. Use whenever implementing or revising game art, scenes, sprites, portraits, UI, maps, lighting, or visual QA.
---

# SAVE SLOT 02 — Visual Integration Skill

## Mission

Turn approved visual direction into a playable, coherent game. Do not invent a parallel art style.

## Source-of-truth order

When visual inputs disagree, use this order:

1. latest files in `docs/art/chatgpt-v2/`;
2. `docs/GAME_04R_VISUAL_REBUILD.md`;
3. `docs/ASSET_IMPORT_CONTRACT.md`;
4. `docs/ART_DIRECTION_V1.md`;
5. `docs/WORLD_BIBLE.md`;
6. old generated placeholders.

## Core behaviour

- Preserve the accepted Canvas 2D engine.
- Prefer approved raster assets/reference art over procedural final art.
- Keep procedural generation only for test fixtures or tiny ambient details.
- Integrate first, reinterpret last.
- If a production asset is missing, use a replaceable placeholder that follows the approved silhouette, palette, scale and composition.
- Never stop the whole milestone merely because one final raster asset is missing.
- Do not spend paid image-generation credits without explicit owner approval.

## Style

Modern pixel art:
- readable characters;
- richer environments;
- warm contemporary lighting;
- coastal/urban Gijón;
- detailed but not noisy;
- nostalgic without looking cheap or deliberately low-resolution.

Avoid:
- permanent CRT/scanlines;
- giant empty floors;
- generic fantasy architecture;
- code-art rectangles as the final environment;
- 16×24 final characters;
- inventing landmarks.

## Characters

### Luis / PLAYER 1
- dark centre-part / curtain hair;
- white long-sleeve top;
- black heart centered on chest;
- blue/dark denim;
- contemporary sneakers;
- minimum map frame target around 32×48.

### Manu / PLAYER 2
- dark voluminous hair;
- black rectangular glasses;
- black hoodie;
- white layer visible below;
- do not introduce into narrative before the planned reveal.

### Randy
- light/cream golden retriever;
- secondary NPC/easter egg;
- never a magical mascot.

## La Muralla

La Muralla is a BAR/CAFÉ, not a literal wall.

Visual anchors:
- apartment façade;
- café frontage;
- beige umbrellas;
- glass terrace windbreak;
- leafy street tree;
- tables/chairs;
- warm interior;
- stone/cobble paving;
- urban bollards;
- planters/flowers;
- ordinary social life.

## Runtime integration

Assets should be replaceable without changing gameplay logic.

Keep:
- nearest-neighbour scaling for sprite art;
- stable manifests for frame size, anchors and animation rows;
- collision footprint smaller than sprite body;
- y-sort from ground anchors;
- architecture baked into background where appropriate.

## Visual QA gate

Before a visual milestone is accepted, provide screenshots at:
- 1920×1080;
- 1440×900;
- 1366×768.

For GAME-04R also provide:
- arrival without dialogue;
- player beside terrace;
- waitress dialogue;
- class-variant interaction;
- player/sprite scale reference.

A technically correct scene can still fail visual QA.
