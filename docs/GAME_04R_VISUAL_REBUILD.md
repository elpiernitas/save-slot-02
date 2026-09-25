# GAME-04R — Visual rebuild acceptance spec

Status: **BLOCKING / authoritative visual gate**

This document supersedes any implication that the current generated PNGs in
`src/assets/world/muralla/` are production-approved. The exploration engine
is accepted. The visual layer is not.

## 1. Goal

Rebuild the first playable slice so a screenshot immediately reads as:

> a modern pixel-art RPG scene set outside **the bar/café La Muralla in
> Gijón**, on an ordinary warm afternoon.

It must NOT read as:

- a castle, fortress, defensive wall or medieval location;
- a generic beige plaza;
- a code-art prototype;
- a 16-bit tileset demo with empty floor;
- a literal trace of Google Street View.

## 2. Reference hierarchy

When references disagree, use this order:

1. Manu's supplied photos / Street View screenshots of La Muralla;
2. the approved ChatGPT visual concept / character board;
3. `docs/ART_DIRECTION_V1.md`;
4. `docs/WORLD_BIBLE.md`;
5. current placeholder/generated assets.

The current generated assets are **last**, not first.

## 3. Scene composition

Logical world may remain 640×360, but the playable camera should show a
compact slice with intentional composition.

Target composition:

- upper 35–45%: apartment façade + actual bar frontage;
- middle 30–35%: terrace, trees, windbreak, doors/windows and NPC life;
- lower 25–35%: walkable paving with enough room for movement and
  interactions.

Avoid a giant empty paving field.

### Required visual anchors

The frame should contain most of these at once:

- large leafy street tree cutting into the upper frame;
- beige La Muralla terrace umbrella;
- café/bar frontage, not an invented shop strip;
- glass windbreak/enclosure around part of the terrace;
- 2–4 occupied tables;
- warm interior light visible through glass;
- pedestrian stone / cobble paving;
- black/grey urban bollards;
- apartment façade above the bar;
- balcony / window detail;
- menu board;
- planters / flowers;
- a small amount of background pedestrian activity.

The real place is a normal urban street. Do not invent sea views, castle walls
or fantasy architecture just to make the frame prettier.

## 4. Perspective

Use a **3/4 urban RPG perspective**.

The player walks on the pavement plane. Façades rise vertically at the back.
Props use ground anchors and y-sort naturally.

The scene may cheat perspective for readability, but all objects must share
the same visual camera.

Do not mix:
- front-on architectural elevation,
- top-down props,
- side-view character sprites.

That mismatch is one of the main reasons the current WIP feels wrong.

## 5. PLAYER 1 scale

Luis should no longer read as a tiny generic sprite.

Target sprite frame:
- preferred: **32×48 minimum**;
- acceptable: 36×54 / 40×60 if visual QA supports it;
- never return to 16×24.

Canon recognition cues:
- dark centre-part / curtain hair;
- white long-sleeve top;
- black heart centred on chest;
- blue denim / dark-blue lower half;
- contemporary sneakers;
- slim silhouette.

The map sprite need not reproduce his face, but it should be recognisable from
hair + outfit + proportions.

Animation minimum:
- idle;
- two walk frames per direction;
- 4 directions.

## 6. Environment art quality

The current `npm run art` generator is a **prototype tool**, not an art
direction.

Allowed:
- hand-authored pixel/raster PNG;
- AI-assisted concept translated into clean production raster;
- procedural helpers for repeated texture or tiny ambient details.

Not acceptable as the final visual solution:
- assembling the whole scene from plain rectangles;
- procedurally generating every façade/tree/table and calling the output final;
- low-detail props simply because they are easy to test.

Runtime architecture should continue to blit raster PNG assets. That part is
good.

## 7. Asset plan

Recommended production structure:

`src/assets/world/muralla/`

- `background-afternoon.png`
  - static façade, base pavement, baked lighting and non-interactive decor;
- `foreground-afternoon.png`
  - optional foreground foliage / architectural occlusion;
- `player-luis.png`
  - 4 directions × 3 frames;
- `npc-waitress.png`
  - provisional generic NPC;
- `tree-large.png`
- `umbrella.png`
- `table-occupied-a.png`
- `table-occupied-b.png`
- `table-empty.png`
- `windbreak-west.png`
- `windbreak-east.png`
- `board.png`
- `bollard.png`
- `planter.png`

Do not over-slice assets if an object is permanently part of the background.

## 8. Lighting / palette

Afternoon:
- cream façades;
- warm amber interior;
- natural green foliage;
- grey-beige stone;
- dark navy / charcoal UI;
- small coral/red accents;
- blue sky only if actually visible from the chosen urban composition.

Lighting should be richer than the sprites:
- soft cast shadows;
- warm window glow;
- leaf highlights;
- subtle reflection on glass;
- no global orange filter covering everything.

## 9. NPC density

The current slice feels empty.

Target:
- one functional NPC (waitress/server);
- 4–8 background figures baked into the environment or low-cost ambient NPCs;
- some tables should look occupied.

Only the functional NPC needs dialogue/collision.

Background figures do not need AI.

## 10. Interactions

Preserve the existing interaction architecture.

For the final slice keep approximately:

- tree / terrace description;
- menu board;
- empty table;
- class-variant bollard;
- bar door/window;
- waitress.

Remove interactions that only exist because the old map had invented
architecture.

Humour remains short and dry.

## 11. Camera / empty space test

At 1920×1080, 1440×900 and 1366×768:

- PLAYER 1 must be immediately readable;
- at least 60% of the frame should contain meaningful art, not empty paving;
- La Muralla must be identifiable as a café/bar within two seconds;
- the main tree/umbrella/frontage should establish the place without text;
- the dialogue box must not cover the player during first arrival.

If a screenshot still works after replacing the title `LA MURALLA` with
nothing, the environment is specific enough.

## 12. Acceptance screenshots

Before GAME-05, produce exactly these review captures:

1. arrival frame, no dialogue;
2. player next to the terrace;
3. player interacting with the waitress, dialogue visible;
4. class-variant bollard interaction;
5. 1366×768 desktop viewport;
6. one frame showing the sprite sheet / player scale.

No GAME-05 work until Manu approves the visuals.

## 13. Technical rules that stay locked

Keep:
- Canvas 2D engine;
- React ownership of save/dialogue/UI;
- input router;
- collision / interaction / checkpoints;
- 640×360 world unless a visual test proves a better choice;
- raster asset loader;
- no Phaser.

## 14. Current generated assets

As of 2026-09-25, the generated background, player, props and art generator are
**WIP placeholders**.

They may be used to test loading, anchors, collision and packaging.

They must not be cited as proof that GAME-04 is visually complete.
