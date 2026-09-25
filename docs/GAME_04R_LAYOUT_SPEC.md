# GAME-04R — La Muralla Layout Spec

Status: active implementation geometry for the visual rebuild.

## Goal

Translate the approved ChatGPT visual direction into a compact, explorable
640×360 world slice without losing the existing engine.

This document controls composition/placement. Exact pixel positions may be
tuned during browser QA, but the relationships should remain.

## Camera

Logical viewport: 640×360.

Target feel:
- PLAYER 1 occupies roughly 7–10% of viewport height;
- camera should not show a giant empty plaza;
- environment should fill the frame with recognizable depth;
- first arrival should already show café, tree, umbrellas and street furniture.

Recommended camera behaviour:
- soft follow;
- small dead zone around PLAYER 1;
- clamp to map bounds;
- no dramatic zoom/pan.

## Scene zones

### ZONE A — façade / bar frontage
Approximate upper 35–40%.

Contains:
- apartment façade;
- La Muralla frontage;
- warm windows;
- awning/signage;
- main door/window interaction;
- planters;
- optional baked background people.

Mostly non-walkable.

### ZONE B — terrace
Middle 30–35%.

Contains:
- beige umbrellas;
- tables/chairs;
- glass windbreak;
- waitress functional NPC;
- one empty interactive table;
- occupied tables baked or low-cost ambient.

Partially walkable with tight collision lanes.

### ZONE C — pedestrian paving
Lower 30–35%.

Contains:
- player spawn;
- tree base / bollards;
- clear movement route;
- one class-variant bollard;
- contextual prompt space.

Do not fill with huge uninterrupted pavement.

## Suggested world dimensions

Start from approximately 960×540 world pixels, using a 640×360 camera.

This gives enough room for a gentle camera follow while keeping the location
compact.

Do not create a full city block.

## First arrival

Spawn should position Luis:
- in lower-centre/left third;
- facing toward café/terrace;
- with the main visual anchors already visible;
- not directly under dialogue UI.

Arrival dialogue should not cover his sprite.

## Interactables

### INT-01 — tree
Visual:
large leafy street tree.

Anchor:
base/trunk on pedestrian plane.

Interaction:
short descriptive line.

### INT-02 — menu board
Visual:
small café board near terrace/frontage.

Interaction:
short dry joke / description.

### INT-03 — empty table
Visual:
clearly empty table, separate from occupied tables.

Interaction:
existing remembered-state behaviour can stay.

### INT-04 — class bollard
Visual:
one urban bollard close enough to face/interact with.

Interaction:
GUERRERO / TANQUE / CURADOR flavour variant.

### INT-05 — bar door/window
Visual:
obvious entrance/window in façade.

Interaction:
short line; does not need to open yet.

### INT-06 — waitress
Visual:
functional NPC inside/edge of terrace.

Interaction:
DialoguePlayer.

## Collision principles

- architecture collider should follow visible façade/terrace edge;
- table colliders should be compact, allowing narrow walking lanes;
- tree collider should be ground/trunk only, not canopy;
- windbreak should act as a thin wall;
- background people baked into art should not introduce invisible colliders;
- bollards should have tiny ground footprint;
- no collider should extend far beyond visible geometry.

## Depth / y-sort

Use ground anchor.

Suggested order:
1. baked background;
2. back terrace props;
3. NPCs/player and mid props;
4. foreground foliage / near objects;
5. HUD;
6. dialogue UI.

## Density target

A still frame should contain:
- 1 large natural anchor (tree);
- 1 clear architectural anchor (bar frontage);
- 2–4 tables;
- 1 umbrella cluster;
- 1 glass barrier;
- 3–6 small urban props;
- 4–8 background human figures total, mostly baked.

## Lighting

Afternoon:
- warm, not orange-washed;
- interior lights already on;
- soft pavement shadows;
- small reflective highlights on glass;
- foliage with warm highlights and cool shadow pockets.

## Forbidden rebuild patterns

Do not:
- return to medieval wall/gate visuals;
- make one enormous flat beige floor;
- use a front elevation with top-down props;
- place unrelated stock-like props in a line;
- use the visual concept as a single flattened runtime background if that
  prevents correct player/NPC layering.

## Acceptance image

Hide HUD and prompts.

If the image still immediately reads as:
"urban café terrace in Gijón / Cimavilla",
the layout is working.
