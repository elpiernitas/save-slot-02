# SAVE SLOT 02 — Puzzle Bible

Status: source of truth for puzzle design.

## Philosophy

Puzzles exist to make the player *do* something, not to test how well he knows
Manu.

Good puzzle:
- spatial;
- observational;
- pattern-based;
- inventory-based;
- timing-light;
- system/route logic.

Bad puzzle:
- "what's our anniversary?";
- "what is my favourite X?";
- private-chat password;
- hidden pixel hunting;
- long sliding blocks;
- random guessing;
- reflex difficulty that fights accessibility.

## Difficulty target

Luis should usually understand the mechanic within 10–20 seconds.

A first clear can take:
- micro: 20–60 s;
- normal: 1–3 min;
- set-piece: 2–4 min.

No single mandatory puzzle should exceed about 4 minutes on a normal run.

## Hint ladder

Every mandatory puzzle should support a 3-step hint ladder.

### Hint 0
No hint. Let the player read the scene.

### Hint 1
Short system nudge after one failure or ~30–45 s.

### Hint 2
More explicit spatial/mechanical clue after repeated failure.

Never instantly reveal the exact input sequence unless accessibility or
debug mode requests it.

Hints should not shame the player.

## Reset

Reset should be:
- fast;
- clearly visible;
- state-safe.

Do not reload the page.

## Attempts

Attempts are runtime-only until puzzle completion.

The save stores final attempts for flavour/analytics only.

Do not show a score grade.

## Class variation

Class may affect:
- one line;
- one hint;
- animation flavour;
- cosmetic route.

Class must not:
- lock a puzzle;
- make a mandatory puzzle impossible;
- create three large implementations.

## Inventory integration

Items can:
- reveal a clue;
- unlock an optional interaction;
- satisfy one step.

Avoid arbitrary "use key on door" chains unless the object-world relationship
is obvious.

## CITY CARD integration

Cards are rewards/records, not puzzle keys by default.

Do not require card collection completion to progress.

## Optional microgames

A microgame is optional if:
- it can be left immediately;
- it has a small reward;
- failure has no narrative penalty;
- the main route ignores it.

Use optional microgames for jokes, atmosphere and replay value.

## UI

Instructions:
- one sentence max when possible;
- controls already known should not be re-explained in paragraphs.

SYSTEM language can label:
- SYNC;
- ROUTE;
- INPUT;
- SIGNAL;
- ERROR;
- RETRY.

Narrator/character dialogue remains Spanish.

## Puzzle IDs

Use stable semantic ids.

Examples:
- `route.cholo_beacons`
- `micro.seagull_protocol`
- `system.player_sync`

Do not name ids after implementation details like `puzzle3`.

## Completion

A completion should produce at least one of:
- route opens;
- narrative state advances;
- optional reward;
- world changes visibly.

Avoid a puzzle ending with only "correct".

## Replay

Mandatory completed puzzle:
- may remain solved;
- can offer a short inspect line;
- should not require replay after refresh.

Optional microgame:
- may be replayable;
- first-clear reward only.

## Fairness checklist

Before accepting a puzzle:
- Can the clue be seen?
- Is there enough contrast?
- Can colour-blind users distinguish states by shape/position too?
- Can it be solved without sound?
- Does wrong input teach something?
- Is reset immediate?
- Does Escape behave predictably?
- Does reduced motion remain playable?
