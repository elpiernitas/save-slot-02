# SAVE SLOT 02 — Image Generation Briefs

Status: reusable art-request templates for ChatGPT / any approved image generator.

These are not prompts to blindly copy into a paid service. They define the
visual request so ChatGPT and Claude can collaborate consistently.

## Global visual prefix

Use this direction for production art:

> Modern detailed pixel-art indie RPG, contemporary 2020s reinterpretation of
> a handheld RPG, clean readable silhouettes, rich urban environment,
> restrained outlines, warm cinematic but natural lighting, Gijón coastal
> atmosphere, not Game Boy, not 8-bit parody, not CRT, not chunky programmer
> rectangles, no copyrighted game UI or characters.

## ENVIRONMENT brief template

```
ASSET ID:
PHASE:
RUNTIME/REFERENCE:
TARGET SIZE:
CAMERA/PERSPECTIVE:
TIME OF DAY:

LOCATION:
[real-world location description]

MUST SHOW:
- ...
- ...

MUST NOT SHOW:
- ...

PLAYER WALKABLE PLANE:
[where the character moves]

LAYERING:
- background architecture
- midground props/NPCs
- optional foreground occlusion

LIGHTING:
...

STYLE REFERENCES:
- docs/art/chatgpt-v2/visual-bible.jpg
- docs/art/chatgpt-v2/ui-reference-board.jpg
- other exact repo reference

OUTPUT:
- no UI
- no text unless signage is explicitly required
- no main player baked into background
- original artwork, do not copy Street View pixels
```

## CHARACTER SPRITE brief template

```
ASSET ID:
CHARACTER:
FRAME TARGET:
SHEET:
4 direction rows: down/up/right/left
3 columns: idle/step A/step B
transparent background

CANON:
- hair:
- glasses:
- top:
- trousers:
- shoes:
- silhouette:

STYLE:
match SAVE SLOT 02 modern pixel-art world.

TECHNICAL:
- feet aligned consistently
- no drop shadow baked into sprite
- no labels/text
- enough detail that outfit cue survives at runtime scale
```

## PORTRAIT brief template

```
CHARACTER:
EXPRESSIONS:
- neutral
- ...
FORMAT:
transparent or simple flat cutout
consistent head/shoulder crop
same outfit/hair as overworld

STYLE:
more detailed than map sprite but clearly same game
warm natural shading
no anime exaggeration unless reference supports it
```

## UI REFERENCE brief template

```
SCREEN:
PURPOSE:
LOGICAL STAGE:
480×270 UI grid / 16:9 presentation

REQUIRED ELEMENTS:
...

VISUAL GRAMMAR:
deep navy, warm cream, muted coral, warm gold, coastal green,
crisp pixel borders, no glassmorphism, no modern SaaS cards.

IMPORTANT:
this is a visual reference, not new gameplay logic.
Do not invent stats/tabs/choices that should become product requirements.
```

## Specific — ENV-001 La Muralla

Purpose:
production/reference art for GAME-04R.

Scene:
urban pedestrian street outside the bar/café La Muralla in Cimavilla, Gijón,
ordinary warm afternoon.

Must show:
- residential façade above café;
- recognisable café frontage;
- beige umbrellas;
- glass windbreak;
- large leafy street tree;
- 2–4 tables;
- some occupied terrace life;
- warm interior windows;
- grey-beige granite/stone paving;
- urban bollards;
- planters/flowers;
- compact walkable foreground.

Must not show:
- medieval wall;
- castle gate;
- sea invented directly behind café;
- giant empty plaza;
- fantasy tavern;
- UI/dialogue;
- Luis baked into environment.

Composition:
3/4 urban RPG perspective matching runtime player/props.

## Specific — CHAR-001 Luis

Canon:
- young man;
- dark centre-part curtain hair;
- white long-sleeve top;
- black heart centered on chest;
- blue/dark denim;
- black/white sneakers;
- slim contemporary silhouette;
- no glasses.

Need:
4×3 movement sheet, transparent.

## Specific — CHAR-003 Manu

Canon:
- young man;
- dark voluminous hair;
- black rectangular glasses;
- black hoodie;
- white under-layer visible;
- dark/blue trousers;
- contemporary sneakers.

Do not use in GAME-04R player flow.

## Specific — CHAR-005 Randy

Light/cream golden retriever.
Normal dog, not magical.
Need standing/walk/sit/attentive/sleep references.

## Negative direction library

Avoid:
- generic fantasy;
- medieval architecture unless a real location calls for it;
- faux Pokémon UI;
- chibi giant-head proportions;
- mobile app dashboard;
- excessive gradients;
- photorealistic pasted cutouts;
- neon cyberpunk by default;
- giant hearts/romance iconography;
- unreadable micro-pixel characters;
- text generated inside art when runtime UI can render it.


## Specific — BOSS-ENV-001 DESYNC arena

Purpose:
GAME-07 system-space arena reference / possible raster background.

Scene:
modern detailed pixel-art synchronization arena, designed for a readable
640×360 logical gameplay space.

Must show:
- deep navy stable floor/background;
- pale cyan/cream signal geometry;
- three distinct stabiliser nodes;
- one central recovery core;
- subtle duplicated/broken synchronization blocks;
- generous player movement space;
- clean gameplay readability.

Must not show:
- monster;
- face;
- corrupted person;
- horror;
- giant eye;
- demonic imagery;
- romantic hearts;
- text baked into art;
- character baked into background;
- neon cyberpunk overload;
- CRT scanlines.

## Specific — BOSS-FX-001 DESYNC hazards

Reference sheet showing:
- bar sweep telegraph / active;
- pulse-zone telegraph / active;
- final ring telegraph / active;
- stabiliser inactive / active / complete;
- PLAYER hit / invulnerability treatment.

Use shape and geometry, not colour alone.

## Specific — REVEAL-001 PLAYER SLOT 02

Purpose:
GAME-07 reveal UI reference.

Composition:
16:9 stable system-space, central player-slot panel, silhouette resolving into
Manu, navy/cream/cyan palette, restrained pixel borders.

Mood:
recognition, relief, tiny bit of humour.

Must not show:
- date options;
- hearts/confetti;
- romantic slogans;
- wedding/couple imagery;
- long text baked into image.

Runtime text will be rendered separately.

## Specific — COOP-001 2/2 gate

Small system-space room with:
- PLAYER 1 left pad;
- PLAYER 2 right pad;
- central locked gate;
- clean system geometry;
- both player silhouettes readable;
- room for short scripted movement.

No combat.
No companion-AI implication.
