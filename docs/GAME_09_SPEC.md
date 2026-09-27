# GAME-09 — Ending + Final Save Slot

Status: **PREPARED / BLOCKED UNTIL GAME-08 ACCEPTANCE**

## 1. Product goal

Close the game cleanly after the player chooses a real-world date.

The ending should feel like:
- the save file finally makes sense;
- the system has completed its hidden task;
- the player has made a real choice;
- the site remains worth reopening.

The ending should NOT feel like:
- a slideshow;
- a wedding proposal;
- a giant emotional speech;
- a credits wall;
- confetti web design;
- a dead-end page.

## 2. Flow

GAME-08 confirmation
→ `ROUTE LOCKED`
→ short save animation
→ `ending`
→ `saveSlot`

The `ending` scene is the emotional/gameplay beat.

The `saveSlot` scene is the persistent post-completion status screen.

## 3. Completion state

Existing save already includes:

```ts
timestamps.completedAt: IsoTimestamp | null
dateQuest.chosenOptionId
dateQuest.chosenAt
boss.defeated
```

Add reducer action:

```ts
{ type: 'game/complete'; at: string }
```

Rules:
- first completion wins;
- sets `timestamps.completedAt`;
- subsequent calls no-op;
- no save version bump.

Completion is valid only after a date is chosen at scene-flow level.

Reducer may remain generic and not enforce story prerequisites if tests/flow
do so, but preferred helper should guard accidental early completion.

## 4. Ending beat

Target length:
20–45 seconds.

Suggested structure:

### Beat A
`SAVING...`

Small slot animation / checksum.

### Beat B
`SIDE QUEST — COMPLETE`

Do not reveal every collected statistic.

### Beat C
PLAYER 1 + PLAYER 2 shown together.

One short human line.

Possible tone direction:
`MANU: bien. ahora ya solo falta hacer la parte que no cabe aquí.`

Alternative:
`MANU: guardado. no lo rompas antes del día elegido.`

Final exact line can be tuned during implementation.

### Beat D
Chosen route displayed clearly.

Example:
`THURSDAY · 01 OCTOBER`

Do not invent time/place if none has been agreed.

### Beat E
`SAVE SLOT 02 — UPDATED`

Transition to persistent `saveSlot`.

## 5. SaveSlot scene

This becomes the normal CONTINUE destination after completion.

Use existing scene id:
`saveSlot`.

### Display

Core status:
- SAVE SLOT 02
- PLAYER 1 — LUIS
- CLASS — chosen class
- PLAYER 2 — MANU
- SIDE QUEST — COMPLETE
- DATE ROUTE — chosen date

Optional:
- CITY CARDS discovered count, only if subtle;
- total playtime is not currently tracked, so do not invent it;
- boss attempts only if funny and not cluttered.

Buttons:
- CONTINUE / OPEN SAVE
- CITY CARDS (if available)
- SETTINGS
- optional RESET hidden inside settings/confirmation, not prominent.

Do not show a prominent "PLAY AGAIN" that risks wiping the chosen date.

## 6. Continue semantics after completion

After `game/complete`:
- `progress.resumeSceneId` should resolve to `saveSlot`;
- title CONTINUE leads to saveSlot;
- startup system check still works;
- refresh from ending/saveSlot is safe.

If the current scene routing cannot guarantee this, explicitly route to
`saveSlot` after marking completion.

## 7. Date rendering

Use canonical calendar data.

Human display should be locale-controlled and deterministic enough for tests.

Recommended product copy:
- WEDNESDAY · 30 SEPTEMBER
- THURSDAY · 01 OCTOBER
- SUNDAY · 04 OCTOBER

Or Spanish human line if desired, while SYSTEM labels remain English.

Do not infer a plan time.

## 8. Emotional ceiling

The final human copy should be 1–3 short lines total.

No:
- "forever";
- soulmate;
- destiny;
- "you saved me";
- dramatic relationship recap.

Specificity should come from the game itself, not a speech.

## 9. Visual direction

A calm payoff.

Use:
- cleaner/stabler version of system UI;
- reduced glitch;
- warm accent;
- PLAYER 1 + PLAYER 2 together;
- chosen route visually highlighted.

The visual language should imply:
the corrupted save is now healthy.

No fireworks/confetti.

## 10. Audio

Need:
- save write;
- completion chime;
- subtle final motif once GAME-11 music exists.

Synth-only fallback is acceptable.

## 11. Optional credits

Do not run traditional credits automatically.

If credits are useful, place:
`ABOUT THIS SAVE`
inside post-game menu later.

Could list:
- Made for Luis
- SAVE SLOT 02
without exposing technical toolchain unless Manu wants it.

## 12. Reset safety

A reset action already exists in underlying save services.

Production UI should require deliberate confirmation:
`RESET SAVE DATA?`
`THIS CANNOT BE UNDONE.`

Do not put reset beside CONTINUE.

Reset is not required for GAME-09 if current settings already expose it
safely elsewhere.

## 13. Tests

- game/complete sets completedAt
- duplicate complete no-op
- completion does not change chosen date
- ending requires chosen date through flow
- ending routes to saveSlot
- saveSlot resumes after refresh
- title CONTINUE after completion → saveSlot
- chosen class/player/date labels correct
- reset not accidentally triggered
- CITY CARDS link if present preserves save
- no date route can show null in a completed save

## 14. QA

Test each three canonical chosen dates with seeded saves.

Required:
- full GAME-08 → GAME-09 transition;
- refresh during ending;
- refresh on saveSlot;
- reopen from title;
- 1366×768;
- reduced motion;
- muted audio.

## 15. Acceptance

GAME-09 passes when:
- chosen date is unmistakable;
- final copy remains restrained;
- completion persists;
- reopening site lands in useful save state;
- no accidental reset;
- the game feels finished.

## 16. NEXT

**GAME-10 — post-game unlocks**
