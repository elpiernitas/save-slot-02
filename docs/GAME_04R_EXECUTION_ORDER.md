# GAME-04R — Execution Order

Status: **active implementation checklist**

The goal is not to redesign the engine. The goal is to make the existing engine render an accepted, playable La Muralla vertical slice.

## Phase A — ingest the visual pack

1. Read all files in `docs/art/chatgpt-v2/`.
2. Treat them as visual references, not literal source frames unless explicitly marked.
3. Keep the existing raster loader.
4. Mark the old `npm run art` images as WIP placeholders.
5. Add a small manifest documenting which v2 reference informs each runtime asset.

Deliverable: repo can clearly trace runtime asset → approved reference.

## Phase B — composition pass

Rebuild the La Muralla map composition before polishing props.

Target:
- compact café frontage in upper/right area;
- large leafy tree framing the space;
- terrace and windbreak in the middle;
- enough pedestrian paving for movement without a giant empty plaza;
- architecture, tables and background people create depth;
- warm afternoon light.

Do not add new districts.

Deliverable: static environment screenshot already reads as an urban café in Gijón without HUD text.

## Phase C — PLAYER 1

Replace tiny placeholder PLAYER 1.

Target:
- around 32×48 or visually equivalent;
- four directions;
- idle + two-step walk minimum;
- white top + black heart;
- dark centre-part hair;
- readable at 1366×768.

Update collision box/anchor if needed.

Deliverable: Luis is visually readable at all required desktop sizes.

## Phase D — props + interaction alignment

Wire visible props to existing interactables.

Required:
- tree;
- menu board;
- empty table;
- bollard;
- bar/window/door;
- waitress.

Colliders must match visible geometry, not old coordinates.

Deliverable: every active prompt appears where the visible object is.

## Phase E — dialogue staging

Use the existing DialoguePlayer.

Check:
- dialogue never hides the player on arrival;
- portrait/style matches the v2 UI references;
- location HUD and interaction prompt use the same visual language;
- no giant programmer-debug labels.

Deliverable: waitress interaction screenshot looks like one coherent game.

## Phase F — class variant

Keep exactly one micro-variation per class in the slice.

Do not create alternate routes.

Verify:
- GUERRERO;
- TANQUE;
- CURADOR.

Deliverable: the same interactable returns the three correct flavour variants.

## Phase G — save/resume

Verify:
- checkpoint survives refresh;
- returning from TITLE resumes correctly;
- dialogue state does not corrupt player movement;
- no stale input handlers after scene teardown.

Deliverable: refresh + continue returns to a sane location.

## Phase H — final QA

Required screenshots:
1. arrival, no dialogue;
2. player next to terrace;
3. waitress dialogue;
4. class-variant interaction;
5. 1366×768 viewport;
6. sprite/player scale reference.

Required commands:
- npm run typecheck
- npm run lint
- npm run format:check
- npm test
- npm run build
- npm run check

## Acceptance

Do not start GAME-05 until visual review explicitly accepts GAME-04R.

If a screenshot still looks like a prototype, continue GAME-04R.
