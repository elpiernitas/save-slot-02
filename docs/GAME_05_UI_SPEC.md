# GAME-05 — Inventory + CITY CARDS UI Spec

Status: prepared, implementation blocked until GAME-04R visual ACCEPT.

## 1. Entry points

From the world pause panel, add:

- CONTINUAR
- INVENTARIO
- CITY CARDS
- SETTINGS
- VOLVER AL TÍTULO

If SETTINGS is not yet available from the pause panel, adding it in GAME-05 is
allowed because the settings system already exists. Do not duplicate settings
state.

## 2. Overlay model

Inventory and CITY CARDS are React overlays.

The exploration engine stays mounted underneath and remains paused.

Opening an overlay:
- pauses world input immediately;
- captures panel input;
- does not change `progress.sceneId`;
- does not create a new checkpoint.

Closing:
- restores prior pause/world state;
- uses the same input cooldown strategy as dialogue/menu;
- Escape never leaks into the world.

## 3. INVENTARIO layout

Desktop 16:9.

### Frame

Top:
`INVENTARIO`

Main region:
- left column ~38%;
- right detail ~62%.

Footer:
- navigation hints;
- BACK hint.

### Left column

Rows:
- optional small icon;
- name;
- quantity when >1;
- category marker.

Selection:
- one row at a time;
- wrap navigation permitted;
- no page scroll.

Empty state:
`NO ITEMS FOUND.`
Then a smaller Spanish narrator-style line may be omitted; keep it clean.

### Right detail

Shows:
- larger icon;
- item name;
- category;
- description.

No fake RPG stats.

No USE button by default.

If a future item is usable from menu, add capability per item instead of a
generic button that does nothing.

## 4. CITY CARDS layout

Top:
`CITY CARDS`

Main:
- binder/grid on left/centre;
- focused-card detail on right.

Recommended at 640×360 logical UI:
- 2 columns × 2 rows visible or 3×2 if cards remain readable;
- paginate rather than tiny thumbnails.

### Owned card tile

Shows:
- card number;
- miniature art;
- name;
- rarity accent;
- NEW badge when unseen.

### Focused card

Shows:
- larger card;
- name;
- kind;
- rarity;
- flavour;
- obtained date/time in subtle system text.

Do not show:
- attack;
- HP;
- power;
- price;
- trade value.

## 5. Unknown / secret behaviour

Default binder lists owned cards only.

Secret cards:
- completely hidden until owned.

Future known-but-unowned cards may show a silhouette only when narrative has
explicitly revealed their existence.

No completion percentage.

## 6. Acquisition overlay

### Item

Header:
`ITEM OBTAINED`

Body:
- icon;
- item name;
- one-line description.

### Card

Header:
`CITY CARD ADDED`

Body:
- enlarged card;
- `#001 · LA MURALLA`;
- rarity treatment.

Confirm:
- Enter / Space / click;
- first confirm closes overlay;
- no accidental next interaction.

## 7. NEW state

A newly acquired card has `seen: false`.

Rules:
- opening binder alone does not mark all cards seen;
- selecting/focusing a card is not enough;
- entering its detail/enlarged state marks that card seen;
- after refresh it remains seen.

If the UI has no separate detail state, marking seen after a stable focus
delay is acceptable only if implemented/tested intentionally.

## 8. Keyboard

Inventory:
- Up/Down or W/S = item selection;
- Enter/Space = inspect if separate inspect mode exists;
- Escape = back.

Cards:
- arrows/WASD = grid;
- Enter/Space = open detail;
- Escape = close detail / then close binder.

Mouse:
- move = select;
- click = confirm/open;
- close/back button allowed.

Keep existing rule: a resting mouse pointer must not steal keyboard selection
when a panel appears.

## 9. Responsive desktop

Required:
- 1920×1080;
- 1440×900;
- 1366×768.

No body scroll.

Panels must stay within the 16:9 stage.

At 1366×768:
- card name remains readable;
- card illustration remains meaningful;
- item detail is not cramped.

## 10. Visual grammar

Use `UI_SYSTEM_V2.md`.

Inventory:
- navy/cream;
- small stone/green category accents.

Cards:
- richer frame;
- same game identity;
- card art may be brighter.

No modern app-dashboard look.

## 11. Reduced motion

Disable:
- card sheen;
- panel slide;
- badge pulse.

Keep:
- instant state changes.

## 12. Sound

Use existing synth SFX initially:
- navigation blip;
- confirm;
- card acquisition may have a slightly brighter generated tone.

No external samples required.

## 13. QA capture set

When GAME-05 is implemented, include:
1. inventory empty/normal state;
2. item detail;
3. binder with at least two cards;
4. enlarged NEW card;
5. acquisition overlay;
6. 1366×768 full game frame.
