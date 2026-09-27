# SAVE SLOT 02 — Release Critical Path

Target send date: **Monday 28 September 2026**

This document exists to prevent the project from dying from ambition.

## Release definition

A release is successful if Luis can:
1. open the link;
2. enter fullscreen or continue in window;
3. choose a class;
4. explore a visually good first Gijón area;
5. complete a short sequence of game mechanics;
6. encounter the DESYNC boss;
7. discover PLAYER 2 = Manu;
8. choose a real date;
9. reach a persistent final save slot.

Everything else is secondary.

## Hard blocker right now

**GAME-04R visual integration.**

Do not let later prepared specs distract from fixing the actual first playable
world.

## Phase priority

### P0 — release path
- GAME-04R
- minimum GAME-05
- minimum GAME-06
- GAME-07
- GAME-08
- GAME-09
- GAME-12

### P1 — quality
- GAME-11 P0 audio/polish subset
- fuller GAME-05
- optional GAME-06 microgame

### P2 — cuttable
- GAME-10 extras
- achievements beyond 1–2
- Randy cameo
- extra cards
- optional second/third puzzles
- multiple OST tracks
- extra world districts

## Minimum viable cuts

If schedule slips:

### GAME-05 CUT
Ship:
- CITY CARD acquisition;
- binder;
- no separate inventory UI unless a puzzle needs an item.

The save inventory model may remain unused.

### GAME-06 CUT
Ship:
- one compact environmental puzzle;
- SYNC TERMINAL.

Cut:
- SEAGULL PROTOCOL;
- second full exploration map if art is not ready.

A puzzle can be embedded in the existing world/system transition.

### GAME-07 NEVER CUT
Boss can be simplified, but PLAYER 2 reveal cannot be removed.

Minimum boss:
- one arena;
- two pattern types;
- three stabiliser nodes;
- 60–90 seconds.

### GAME-08 NEVER CUT
The date choice is the actual purpose of the project.

### GAME-09 NEVER CUT
Persistent ending/save slot required.

### GAME-10 CUT ENTIRELY
Safe to release without it.

### GAME-11 CUT
If time:
- retain existing synth SFX;
- add only one simple system/world music loop or even ship musicless if audio
  quality would be worse;
- do placeholder purge and visual consistency.

Do not risk stability for soundtrack ambition.

## Quality rule

Do not reduce visual quality of GAME-04R to save time.

The first explorable screenshot defines the perceived quality of the whole
game.

Reduce *quantity*, not the approved art direction.

## Engineering rule

Prefer existing contracts:
- current save shape;
- current dialogue engine;
- current world engine;
- current input router;
- current scene ids;
- current calendar.

Avoid schema/framework rewrites.

## Review gates

Claude completes a milestone → ChatGPT reviews actual repo/screenshots.

Only explicit ACCEPT opens next gated phase.

If deadline requires a scope cut, ChatGPT may revise the next milestone spec
without asking Manu for routine approval.

## Owner interruptions

Do not ask Manu for:
- architecture choices;
- test details;
- UI spacing;
- content IDs;
- refactors.

Ask only for:
- major creative pivot;
- final visual veto/accept if ambiguous;
- paid service spend;
- final public/send action.

## Release sequence

1. GAME-04R visual ACCEPT
2. GAME-05 core
3. GAME-06 core
4. GAME-07
5. GAME-08
6. GAME-09
7. GAME-11 P0 polish
8. GAME-12
9. deploy
10. final smoke
11. send
