---
name: save-slot-inventory-cards
description: Use when implementing or reviewing SAVE SLOT 02 GAME-05 inventory, items, acquisitions, CITY CARDS, binder UI, or their save/dialogue integration.
---

# SAVE SLOT 02 — Inventory + CITY CARDS Skill

## Gate

Do not implement GAME-05 until GAME-04R has explicit visual ACCEPT.

Planning/docs may exist earlier.

## Read first

- `docs/GAME_05_SPEC.md`
- `docs/CITY_CARDS_BIBLE.md`
- `docs/GAME_05_IMPLEMENTATION_ORDER.md`
- `docs/UI_SYSTEM_V2.md`
- `docs/STORY_BIBLE.md`

## Product rule

The inventory/cards system is a reward layer for exploration.

It is not:
- combat progression;
- equipment;
- a relationship scrapbook;
- a quiz;
- gacha;
- Pokémon imitation.

## Technical rule

React/save owns persistent inventory/card state.

World engine only triggers interactions.

Keep UI as overlays/panels so the world can stay mounted and paused.

## Data rule

Static content belongs in registries.

Do not put definitions in components or dialogue scripts.

## Reward cadence

Sparse.

Use only a few rewards in each area.
Do not reward every click.

## CITY CARDS

Original system.

Visual references can inform framing, but third-party card-game layout,
symbols, stats and terminology must not be copied.

## QA rule

Persistence + input cleanup matter as much as visuals.

Always test:
- acquisition;
- refresh;
- NEW state;
- open/close panels;
- world resume;
- keyboard;
- mouse.
