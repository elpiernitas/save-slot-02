# SAVE SLOT 02 — Visual concept v1

Status: **approved direction / reference**, not a production-ready sprite sheet.

Reference image: `docs/art/visual-concept-v1.jpg`

## What this concept locks

- Overall style: **modern pixel art, not excessively retro**.
- Characters stay recognizable at small scale, with more detailed dialogue portraits.
- Environments are richer than the sprites: contemporary light, shadows, vegetation, reflections and readable architecture.
- Gijón should be recognizable but simplified for gameplay.
- The same place may exist in morning / afternoon / sunset / night variants.
- UI remains crisp and RPG-like; no permanent CRT/scanline treatment.

## Character direction

### Luis — PLAYER 1

- Dark hair with centre-part / curtain shape.
- Canon outfit: white long-sleeve top with a black heart centered on the chest.
- Map sprite + dialogue portrait.
- Portrait set later: neutral, serious, slight smile, confused/suspicious.
- Do not lock facial likeness from this concept alone; use Manu's supplied reference photos for final assets.

### Manu — PLAYER 2

- Dark voluminous hair.
- Black rectangular glasses.
- Canon outfit: black hoodie with white layer visible underneath.
- Map sprite + dialogue portrait.
- Portrait set later: neutral, surprised, playful/smug, confused.
- PLAYER 2 still does not enter the narrative until GAME-07.

### Randy

- Light/cream golden retriever.
- Secondary recognizable NPC / easter egg, not magical mascot.
- Map sprite states can include standing, sitting, attentive, sleeping.

## Environment direction

The lower-left panel is a **style study for La Muralla**, based on Manu's Street View references.

> **La Muralla is the bar/café** (terrace, frontage, street), **not** a
> defensive wall. See DECISION_LOG D-054.

Keep:

- pedestrian stone/cobble paving
- terrace tables
- large leafy tree
- café frontage / corner feeling
- warm interior/terrace lights
- Gijón street atmosphere

Do not reproduce Google/Street View pixels or signage literally in production.
Build original environment art from reference.

## Important

This composite was generated as a visual north star. It must **not** be sliced blindly into final production assets.

GAME-04 should use it to:

1. decide exploration technology and logical resolution,
2. build one vertical slice,
3. create/recreate clean production sprites separately,
4. validate sprite scale against an environment,
5. keep character/environment proportions consistent.

Do not generate the entire city from this image.


## Production note — GAME-04R

The current code-generated raster assets are **not the approved look**. They
are placeholders for engine integration only. Production acceptance is now
defined in `GAME_04R_VISUAL_REBUILD.md`.

Key correction: a technically valid PNG pipeline does not equal acceptable
art direction. Final environment art may be hand-authored or AI-assisted and
then cleaned into raster assets; the runtime should simply load/blit those
assets.
