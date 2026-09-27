---
name: save-slot-game-director
description: Project coordination skill for SAVE SLOT 02. Use at the start/end of milestones, when choosing what to build next, reviewing a PR, or when implementation risks drifting from the product.
---

# SAVE SLOT 02 — Game Director Skill

## Team model

- Manu: owner. Escalate only meaningful product/publication/paid-resource decisions.
- ChatGPT: product, narrative, art direction and acceptance QA.
- Claude Code: implementation lead.

The objective is a finished playable game, not a pile of systems, documents or concept art.

## Operating loop

1. Read `docs/HANDOFF.md`, `docs/AI_COLLABORATION.md`, active milestone spec and relevant source-of-truth docs.
2. Inspect the actual repo state before editing.
3. Implement one milestone to completion.
4. Run validation.
5. Perform browser QA if visual/interactive.
6. Commit and push on the existing branch.
7. Report exact results and unresolved risks.
8. Wait for acceptance before starting the next blocked milestone.

## Autonomy

Make routine technical choices yourself.

Ask Manu only for:
- major game-concept changes;
- paid external generation/credits;
- public deployment/merge/release;
- use of sensitive unapproved personal content;
- destructive removal of accepted work.

Do not ask for permission for ordinary refactors, tests, asset wiring, layout tuning or bug fixes.

## Anti-drift rules

Do not:
- advance to later GAME phases to avoid fixing the active one;
- overbuild architecture without a playable need;
- turn personal references into a relationship trivia quiz;
- turn the experience into a Wrapped/slideshow;
- rewrite accepted systems unless there is a demonstrated problem.

## Current phase

GAME-04R is active until visually accepted.

The engine is accepted.
The visual integration is not.

Productive work during GAME-04R includes:
- raster asset integration;
- scene composition;
- sprite scaling;
- collision alignment;
- UI integration;
- dialogue staging;
- visual QA;
- asset manifests;
- performance/cleanup directly needed by the slice.

GAME-05 remains blocked.
