# SAVE SLOT 02 — AI collaboration protocol

Status: authoritative operating model for the project.

## Roles

### Manu — owner
- Defines the real-world intent and can veto major creative/product decisions.
- Should not be required to micromanage implementation.
- Routine technical and creative decisions are delegated.

### ChatGPT — product / creative / QA lead
- Owns product direction, narrative coherence, art direction, acceptance criteria and sequencing.
- Creates/organizes reference assets and specs when useful.
- Reviews Claude's commits, screenshots and architecture.
- Decides what is accepted, rejected or needs revision before the next phase.
- Keeps the roadmap coherent and prevents scope drift.
- Does NOT replace the coding agent when the coding agent is available.

### Claude Code — implementation lead
- Owns code execution in the repo.
- Implements approved specs and assets.
- May make ordinary technical decisions autonomously.
- Must preserve architecture quality, tests and documentation.
- Should ask only when blocked by a genuinely missing decision or external resource.
- Must not reinterpret approved visual/product direction arbitrarily.

## Working loop

1. ChatGPT defines the next milestone and acceptance criteria.
2. Claude implements it in the current branch/PR.
3. Claude reports:
   - what changed;
   - tests/validation;
   - screenshots when visual;
   - unresolved risks.
4. ChatGPT reviews the actual repo/PR, not only Claude's prose.
5. ChatGPT either:
   - ACCEPTS and defines the next milestone; or
   - REJECTS/PARTIALLY ACCEPTS and leaves a focused correction spec.
6. Repeat.

## Important principle

The goal is to **build the game**, not to produce isolated concept art or isolated technical systems.

Visual assets, narrative docs and code only matter when they support a playable milestone.

## Parallel work

While Claude is unavailable, ChatGPT may prepare:
- art assets;
- UI references;
- content specs;
- narrative;
- acceptance tests;
- implementation notes;
- backlog grooming.

When Claude returns, these become inputs to implementation.

## Autonomy

Routine choices should not wait for Manu.

Only escalate:
- a major change of game concept;
- use of paid external services/credits;
- deletion of substantial accepted work;
- public deployment / merge / release;
- sensitive real-person content not already approved.

## Current priority

GAME-04R is still the active milestone.

Technical exploration engine is accepted.
Visual integration is not yet accepted.

The immediate goal is:
**integrate the approved visual direction into the working exploration engine and produce a playable La Muralla slice.**

Do not start GAME-05 until that integrated slice is visually accepted.

## What Claude should do when session resumes

- Read:
  - `docs/AI_COLLABORATION.md`
  - `docs/GAME_04R_VISUAL_REBUILD.md`
  - `docs/ASSET_IMPORT_CONTRACT.md`
  - `docs/ART_DIRECTION_V1.md`
  - `docs/WORLD_BIBLE.md`
- Preserve the working engine.
- Integrate approved raster assets/reference material rather than inventing a new style.
- Keep implementation moving; do not stop merely because some final production art is still being refined.
- Use placeholders only where necessary and label them explicitly.
- Return screenshots and validation for review.
