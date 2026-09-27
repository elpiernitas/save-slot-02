# GAME-05 — Inventory + CITY CARDS

Status: **PREPARED / BLOCKED BY GAME-04R VISUAL ACCEPTANCE**

This is the functional contract for GAME-05. It may be read and refined now,
but implementation must not begin until GAME-04R is visually accepted.

## 1. Product goal

Add a small, satisfying layer of discovery to exploration.

The system should make ordinary Gijón details feel collectible without turning
the game into:
- a relationship quiz;
- a scrapbook / Wrapped;
- a grind;
- a loot game;
- a Pokémon clone;
- an RPG equipment/stat system.

Two complementary surfaces:

1. **INVENTORY** — a few concrete quest/world objects.
2. **CITY CARDS** — original collectible cards representing places, objects,
   NPCs, events and oddities found during play.

## 2. Scope

GAME-05 includes:
- static item definitions;
- static card definitions;
- reducer actions for item/card state;
- dialogue effects `giveItem`, `takeItem`, `giveCard`;
- optional `hasCard` condition;
- inventory UI;
- CITY CARDS binder UI;
- pause-menu access;
- "NEW" state for newly acquired cards;
- 1–2 rewards hooked into the La Muralla slice;
- keyboard + mouse support;
- tests and browser QA.

GAME-05 does **not** include:
- equipment slots;
- character stats;
- combat items;
- crafting;
- shops;
- gacha / packs;
- card battles;
- trading;
- rarity-based power;
- full quest log;
- achievements overhaul;
- photos/messages/memory scrapbook.

## 3. Save / migration

The save already contains:

```ts
inventory: { items: Record<ItemId, InventoryEntry> }
cards: { owned: Record<CardId, OwnedCard> }
```

Therefore GAME-05 should **not bump SAVE_VERSION** unless implementation
discovers a genuine JSON-shape change.

Static definition changes do not require migration.

## 4. Inventory model

The current static category union is provisional.

When GAME-05 starts, replace:

```ts
'key' | 'consumable' | 'lore' | 'equipment'
```

with:

```ts
'quest' | 'object' | 'consumable' | 'key'
```

Reason:
- no equipment system exists;
- "lore" is too archive-like;
- the game needs ordinary objects and quest/system objects.

### Rules

- `quest`: unique, story/mechanic state represented as an object.
- `object`: ordinary world object; usually unique.
- `consumable`: stackable only when a puzzle genuinely uses quantity.
- `key`: unique access object.

Most first-release items should have `maxStack: 1`.

### Acquisition behaviour

`item/give`:
- unknown item id: content error;
- quantity defaults to 1;
- clamp to definition `maxStack`;
- preserve original `acquiredAt` when adding to an existing stack;
- no state change when already at max.

`item/take`:
- quantity defaults to 1;
- no negative quantities;
- delete record when quantity reaches 0;
- missing item = no-op.

## 5. CITY CARDS model

Working name: **CITY CARDS**.

They are original collectible cards inspired by the pleasure of collecting
physical cards, not by any third-party rules/art.

### Card kinds

Add to static `CardDefinition`:

```ts
type CityCardKind = 'place' | 'object' | 'npc' | 'event' | 'system'
```

Recommended static fields:

```ts
interface CardDefinition {
  id: CardId
  number: string
  name: string
  kind: CityCardKind
  rarity: CardRarity
  flavorText: string
  description?: string
  art?: string
  hiddenUntilOwned?: boolean
}
```

These are static content changes only.

### Rarity

Existing:
- common
- uncommon
- rare
- holo
- secret

Rarity is visual/flavour only.

No stats, damage, value, power or deck mechanics.

### Ownership behaviour

For V1, cards are effectively unique.

`card/give`:
- first acquisition creates `{ obtainedAt, count: 1, seen: false }`;
- giving the same card again is a no-op;
- preserve original timestamp.

Keep `count` in the save for forward compatibility, but GAME-05 does not
surface duplicates.

`card/markSeen`:
- marks one owned card seen;
- used when its detail view has actually been opened.

Optional `cards/markAllSeen` is not required.

## 6. Conditions

Existing `hasItem` remains authoritative.

Add only if a real content branch uses it:

```ts
{ kind: 'hasCard'; card: CardId }
```

Do not add speculative condition kinds.

## 7. Dialogue effects

In GAME-05 these stop being unsupported:

- `giveItem`
- `takeItem`
- `giveCard`

They should map to real reducer commands.

`setQuest` may remain unsupported until the quest-log phase unless a
specific GAME-05 interaction requires it.

## 8. Content registry

Create central registries:

- `src/game/content/items.ts`
- `src/game/content/cards.ts`

Each registry must:
- have unique IDs;
- expose validated lookup helpers;
- avoid JSX/functions;
- be deterministic/static;
- be covered by integrity tests.

Unknown IDs should be caught by validation/tests before runtime.

## 9. Initial content

Keep it small.

### Initial inventory candidates

#### `object.coaster`
Name: COASTER
Category: object
Max: 1
Description:
"A circular proof that at some point there was a drink here."

Use:
La Muralla discovery object. No mechanical power.

#### `object.mystery_receipt`
Name: MYSTERY RECEIPT
Category: object
Max: 1
Description:
"Numbers. Abbreviations. A total nobody wants to discuss."

Use:
Future errand-district hook.

#### `quest.player2_slot`
Name: EMPTY PLAYER SLOT
Category: quest
Max: 1
Description while unrevealed:
"Reserved by the system. No compatible player detected."

Use:
ACT III foreshadowing. Do not grant in La Muralla yet unless narrative pacing
specifically calls for it.

#### `key.coast_token`
Name: COAST TOKEN
Category: key
Max: 1
Use:
Future district/puzzle.

Do not implement all candidates just to fill the bag.

### Initial CITY CARDS

#### `city.001.la_muralla`
Number: 001
Name: LA MURALLA
Kind: place
Rarity: uncommon
Flavor:
"Side quest detected. Context unavailable."

#### `city.002.bollard`
Number: 002
Name: BOLLARD Lv. ???
Kind: object
Rarity: common
Flavor:
"Unmoved. Unbothered. Probably load-bearing."

#### `city.003.seagull`
Number: 003
Name: SEAGULL WITH INTENT
Kind: npc
Rarity: rare
Flavor:
"It knows what you did with that snack."

#### `city.004.empty_table`
Number: 004
Name: EMPTY TABLE
Kind: place
Rarity: common
Flavor:
"Technically available. Emotionally complicated."

#### `city.005.cimavilla_afternoon`
Number: 005
Name: AFTERNOON IN CIMAVILLA
Kind: event
Rarity: holo
Flavor:
"The city is doing absolutely nothing dramatic."

#### `city.??? player2`
Kind: system
Rarity: secret
Hidden until owned.
Do not name/reveal PLAYER 2 before GAME-07.

## 10. La Muralla hooks

Only 1–2 rewards in GAME-04's existing slice.

Recommended:

### Reward A — first meaningful exploration
After inspecting enough of the café/terrace or completing the first small
interaction:
- grant `CITY CARD 001 — LA MURALLA`.

### Reward B — class bollard
First successful bollard interaction:
- grant `CITY CARD 002 — BOLLARD Lv. ???`.

The class only changes flavour dialogue, not the card.

Optional object:
- empty table can grant `COASTER`, but only if it feels natural in QA.

Do not shower the player with rewards.

## 11. Acquisition presentation

Do not build a giant reward system.

Preferred V1:
- short reusable acquisition panel;
- pauses world input;
- shows icon/card art, name and category/rarity;
- confirm closes it;
- then returns to dialogue/world.

Examples:

`ITEM OBTAINED`
`COASTER`

or:

`CITY CARD ADDED`
`#001 · LA MURALLA`

No confetti.

Reduced motion = instant reveal.

## 12. Inventory UI

Access from world pause menu.

Pause options after GAME-05:
- CONTINUAR
- INVENTARIO
- CITY CARDS
- SETTINGS (if desired in world pause)
- VOLVER AL TÍTULO

Do not switch gameplay scenes just to open the inventory. Prefer a modal/panel
owned by React so the world engine remains mounted and paused.

### Layout

Desktop 16:9:
- left: item list;
- right: selected-item detail;
- footer: controls;
- no scrolling page/body.

Item row:
- small icon;
- name;
- quantity only when >1;
- optional category.

Detail:
- larger icon;
- name;
- category;
- description.

No generic USE button unless a specific item can be used from the menu.
GAME-05 items are primarily inspected/consumed by contextual world/puzzle
logic.

## 13. CITY CARDS binder UI

Access from pause menu.

### Layout

- left / central: owned-card grid or binder pages;
- right: selected card detail;
- selected card can enlarge;
- NEW badge until opened.

Keyboard:
- arrows/WASD move selection;
- Enter opens/detail;
- Escape returns.

Mouse:
- hover/select;
- click open/detail.

### Unknown cards

Avoid completion-pressure UI.

Default:
- show owned cards;
- hidden/secret cards do not appear;
- optionally show a few discovered-but-not-owned silhouettes later.

Do not show "3/100" or a giant empty checklist.

## 14. Art

Cards must use original art.

Visual grammar:
- same modern pixel-art world;
- stronger frame treatment than normal UI;
- card number;
- kind icon;
- rarity accent;
- small illustration;
- flavour text.

Do not copy Pokémon card layouts, fonts, symbols, borders or rarity markers.

## 15. Input / layering

Inventory and binder use the existing input router.

Priority:
- dialogue/acquisition overlay highest;
- inventory/cards panel above world;
- world input inactive while panel open.

Closing a panel must use the existing cooldown pattern so Escape/Enter does
not leak into the world.

## 16. Architecture

Suggested modules:

```
src/game/inventory/
  types.ts
  catalog.ts
  inventory.ts
  cards.ts

src/game/content/
  items.ts
  cards.ts

src/game/inventory/ui/
  InventoryPanel.tsx
  InventoryPanel.css
  CardBinder.tsx
  CardBinder.css
  AcquisitionOverlay.tsx
  AcquisitionOverlay.css
```

Do not put content arrays inside UI components.

## 17. Tests

Minimum:

### Reducer / pure state
- give unique item;
- stack up to max;
- preserve first acquisition time;
- take item;
- remove at zero;
- unknown/missing handling;
- give card first time;
- duplicate card no-op;
- mark seen;
- no save-version bump.

### Conditions
- hasItem;
- optional hasCard.

### Dialogue effects
- giveItem supported;
- takeItem supported;
- giveCard supported;
- recording host simulated state sees newly granted item/card where relevant.

### Content
- unique item IDs;
- unique card IDs/numbers;
- every art key resolves or is explicitly placeholder;
- no third-party IP names/art.

### UI
- empty inventory;
- item selection;
- binder NEW state;
- keyboard nav;
- mouse;
- escape/cooldown;
- world paused beneath panels.

## 18. QA

Desktop Chromium:
- 1920×1080;
- 1440×900;
- 1366×768.

Test:
- earn an item;
- earn a card;
- open inventory;
- open cards;
- inspect NEW card;
- refresh;
- NEW/ownership persists correctly;
- world resumes without stuck input;
- no scroll;
- console clean.

## 19. Acceptance

GAME-05 passes only when:
- rewards feel sparse and satisfying;
- UI looks like the same game as GAME-04R;
- no stats/equipment creep;
- no relationship quiz/scrapbook feel;
- card system is clearly original;
- save persists;
- all tests/checks green.

## 20. NEXT

After GAME-05:
**GAME-06 — puzzles / minigames**

Do not start GAME-06 inside GAME-05.
