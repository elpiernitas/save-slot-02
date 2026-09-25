# SAVE SLOT 02 — UI System V2

Status: implementation reference.

The game already has functional React UI. This document defines the visual
grammar for retrofitting those components without changing gameplay logic.

## Overall grammar

Visual identity:
- deep navy frame;
- warm cream text;
- muted coral accent;
- warm yellow/gold selection;
- coastal green secondary;
- crisp pixel borders;
- minimal drop shadows;
- no glassmorphism;
- no generic modern rounded-card UI.

## Typography

Current licensed pixel font remains acceptable for game UI.

Hierarchy:
- SYSTEM labels: uppercase, compact;
- titles: uppercase;
- dialogue: sentence case Spanish;
- menu options: uppercase or title case depending on context;
- numbers/date labels: tabular-feeling monospace/pixel.

Avoid over-pixelating body text to the point of poor readability.

## Core components

### UI-01 — Panel

Use for:
- menus;
- HUD blocks;
- save panel;
- inventory detail.

Structure:
- pixel border;
- dark navy fill;
- cream main text;
- accent top edge or corner detail.

### UI-02 — DialogueBox

Existing DialoguePlayer behaviour stays.

Visual:
- lower third;
- speaker tag crossing top border;
- portrait optional;
- cream or dark panel depending on final contrast test;
- continuation marker;
- choices stacked above/inside the dialogue area.

Must support:
- narrator with no portrait;
- SYSTEM green tone;
- normal NPC/player portrait.

### UI-03 — Menu

Existing keyboard/mouse behaviour stays.

Selected:
- warm gold/cream inversion;
- cursor optional;
- never rely on colour alone.

Disabled:
- visible;
- low contrast;
- reason available where useful.

### UI-04 — WorldHUD

Minimal.

Top-left:
- location: LA MURALLA · TARDE.

Near player / bottom:
- contextual interaction prompt only when valid.

Controls help:
- fade after first movement or remain tiny in a corner;
- do not occupy a permanent large panel.

### UI-05 — Pause

Keep functionality:
- continue;
- settings;
- title.

Use the same panel grammar.

### UI-06 — Settings

Keep:
- fullscreen;
- sound;
- text speed;
- motion;
- back.

Do not redesign behaviour.

### UI-07 — ClassSelect retrofit

Do not add stats.

Keep:
- GUERRERO;
- TANQUE;
- CURADOR;
- current descriptions/traits.

Visual target:
- three strong cards;
- sigils;
- silhouette/player preview;
- compact confirm panel.

### UI-08 — SaveSlot

Use throughout the game as a recurring system motif.

Fields may include:
- PLAYER 1;
- class;
- location;
- side quest state;
- PLAYER 2 state later;
- chosen date later.

Avoid dumping debug/state data.

## Motion

Small:
- cursor blink;
- panel reveal;
- portrait pop/slide;
- prompt fade;
- tiny selected-item nudge.

Reduced motion:
- disable or make instant.

Do not animate entire scene UI continuously.

## Sound

Use existing synthesized UI blips.

Future:
- distinct confirm/cancel/save sounds;
- no need for sampled copyrighted UI audio.

## Accessibility

- keyboard-first;
- mouse-supported;
- strong focus state;
- readable contrast;
- no meaning only by colour;
- TEXT SPEED INSTANT remains available;
- reduced-motion support remains.

## Implementation order

For GAME-04R:
1. WorldHUD
2. contextual prompt
3. DialogueBox visual retrofit
4. pause panel
5. settings consistency

Later:
6. class select retrofit
7. inventory/cards
8. map/journal
9. date portals
10. final save.
