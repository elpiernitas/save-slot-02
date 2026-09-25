# GAME-05 — Implementation Order

Status: **READY FOR CLAUDE, BUT BLOCKED UNTIL GAME-04R ACCEPT**

When GAME-04R receives visual ACCEPT, execute this file in order.

## 0. Preconditions

- GAME-04R accepted.
- Read `docs/GAME_05_SPEC.md`.
- Read `docs/CITY_CARDS_BIBLE.md`.
- Read `docs/UI_SYSTEM_V2.md`.
- Preserve save compatibility unless a real schema change is needed.

## 1. Static contracts

Update inventory/card static types:
- item categories;
- card kind/metadata.

Do not change save JSON unnecessarily.

Add content registries and validation.

## 2. Reducer

Add:
- `item/give`;
- `item/take`;
- `card/give`;
- `card/markSeen`.

Pure, deterministic, timestamped.

## 3. Dialogue bridge

Support:
- giveItem;
- takeItem;
- giveCard.

Remove those three from unsupported-effect table.

Keep setQuest unsupported unless explicitly needed.

## 4. Conditions

Use existing hasItem.

Add hasCard only if actual GAME-05 content needs it.

## 5. Initial content

Implement only approved first-set entries actually used by the slice.

At minimum:
- CITY CARD 001 LA MURALLA;
- CITY CARD 002 BOLLARD Lv. ???.

Optional:
- COASTER item if it improves the empty-table interaction.

## 6. Acquisition overlay

Build one reusable item/card acquisition presentation.

Requirements:
- input capture;
- reduced-motion support;
- returns cleanly to world/dialogue;
- no double-enter leak.

## 7. Inventory UI

React overlay/modal.

World remains mounted and paused.

Implement:
- list;
- detail;
- empty state;
- keyboard;
- mouse;
- Escape/back.

## 8. CITY CARDS binder

React overlay/modal.

Implement:
- owned cards;
- selected detail;
- NEW badge;
- mark seen on detail open;
- hidden secret behavior;
- keyboard/mouse.

No completion counter.

## 9. Pause integration

Add panel entry points.

Do not duplicate state machines.

## 10. World rewards

Wire sparse rewards into existing La Muralla interactables.

Do not rewrite the scene narrative.

## 11. Tests

Follow GAME_05_SPEC minimum test matrix.

Maintain all previous tests.

## 12. QA

Required desktop viewports:
- 1920×1080;
- 1440×900;
- 1366×768.

Test acquisition → panel → refresh → resume.

## 13. Docs

Update:
- HANDOFF;
- ROADMAP;
- DECISION_LOG;
- ASSETS;
- any relevant content docs.

## 14. Final response format

GAME-05 STATUS

STATE MODEL
ITEMS
CITY CARDS
DIALOGUE EFFECTS
INVENTORY UI
BINDER UI
WORLD HOOKS
SAVE
TESTS
VALIDATION
VISUAL QA
FILES
NEXT

NEXT:
**GAME-06 — puzzles / minigames**

Do not start GAME-06.
