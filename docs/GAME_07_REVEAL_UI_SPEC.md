# GAME-07 — PLAYER 2 Reveal UI / Staging Spec

Status: authoritative reveal staging.

## 1. Purpose

This is the emotional centre of the game, but it should remain restrained.

The desired reaction is:

> "ah, claro, eras tú"

not:

> "the game is now giving me a speech about our relationship."

Target duration:
**35–50 seconds** from `SIGNAL FOUND` to restored player control.

## 2. Scene structure

Use existing scene:
`player2Reveal`

Dedicated React scene is preferred.

Do not run the reveal as one giant DialoguePlayer script over the boss arena.

## 3. Visual beats

### R0 — clean system field

Boss corruption disappears.

Background:
- deep navy;
- stable thin grid/lines;
- no horror glitch;
- audio settles.

Text:
`SCANNING FOR MISSING INPUT...`

Duration:
~1.2 s, skippable only after first view if needed.

### R1 — signal

Text changes:
`SIGNAL FOUND`

Small system confirmation SFX.

Pause:
~600–900 ms.

### R2 — slot card

A save-slot/player-card panel appears.

Header:
`PLAYER SLOT 02`

Status:
`IDENTITY DATA RECOVERED`

Visual:
Manu begins as a dark pixel silhouette / low-information sprite.

Do not show name yet.

### R3 — resolve

Silhouette resolves into approved Manu sprite/portrait.

Then type:
`PLAYER 2 — MANU`

No giant heart.
No confetti.
No romantic background change.

### R4 — human line

Lock the release line to:

**MANU:** `¿me ha cargado bien por lo menos?`

Reason:
- game-aware;
- dry;
- recognisable personality without overselling emotion;
- directly acknowledges the reveal.

One line only.

Do not append another joke.

### R5 — system party state

Text:
`PLAYER LINK — STABLE`
`PARTY STATUS — 2/2`

This is the actual payoff.

### R6 — control returns

Transition to a tiny cooperative gate space.

Luis remains PLAYER 1.

Manu is scripted PLAYER 2.

## 4. Cooperative gate

Duration:
20–35 s maximum.

Layout:
- two simple floor switches / terminals;
- visible gate;
- PLAYER 1 left side;
- PLAYER 2 right side.

Mechanic:
1. Luis walks to/interacts with left switch.
2. Once PLAYER 1 side is active, Manu walks automatically to right switch.
3. Manu activates it.
4. system reads `2/2 PLAYERS — READY`.
5. gate opens.
6. both sprites move/face forward.

No companion AI.
No pathfinding framework.

A 3–5 waypoint scripted path is sufficient.

## 5. Manu scripted movement

Use deterministic waypoints.

Must survive:
- reduced motion;
- refresh/re-entry;
- animation interruption;
- browser slowdown.

If animation is skipped:
snap Manu to final required position and complete his switch state.

Never let the gate deadlock because a CSS transition event failed.

## 6. Save / re-entry

Boss defeat must already be persisted before reveal.

Reveal completion:
use a minimal flag:
`story.player2Found = true`

Recommended because boss defeat and reveal completion are not exactly the same
state.

On refresh:

### boss.defeated = true, player2Found != true
Resume at `player2Reveal`, but allow compressed reveal:
- SIGNAL FOUND
- PLAYER 2 — MANU
- party stable

Do not replay boss.

### player2Found = true
CONTINUE routes after reveal/co-op gate toward GAME-08 setup.

## 7. Portrait / sprite

Manu canon:
- black rectangular glasses;
- dark voluminous hair;
- black hoodie;
- white under-layer visible;
- dark/blue trousers.

The glasses are the fastest recognition cue and must survive portrait/sprite
scale.

If final sprite is delayed:
- use the approved ChatGPT reference asset;
- do not use a random generic character;
- do not hide identity behind silhouette for the entire reveal.

## 8. Dialogue presentation

Reveal line uses normal DialogueBox after the system card identifies him, or a
small portrait dialogue panel.

Do not mix:
- terminal green text;
- normal dialogue;
- save-card typography
all at the same instant.

Stage them sequentially.

## 9. Audio

Need only generated/synth cues:
- scan;
- signal found;
- identity resolve;
- party link;
- gate unlock.

No sentimental music swell required.

If GAME-11 later adds music:
use a restrained reprise of the main motif.

## 10. Reduced motion

- silhouette resolution becomes instant crossfade/state swap;
- no scanline wipe needed;
- scripted Manu movement may be shortened or snapped if motion reduction
  requests it;
- all information remains visible.

## 11. Accessibility

- name rendered as text, not only portrait;
- status not colour-only;
- reveal can be advanced with Enter/Space;
- click works;
- no mandatory timed reaction during reveal.

## 12. What not to write

Forbidden reveal copy:
- "siempre fuiste tú"
- "mi persona"
- "destino"
- "alma gemela"
- "todo empezó aquel día"
- chronological memories
- explanation of breakup/history
- "te hice este juego porque..."

Those belong nowhere in this reveal.

## 13. End beat

After gate opens:

SYSTEM:
`FINAL SIDE QUEST DATA RECOVERED`

Then:
`DESTINATION DATA AVAILABLE`

Do not show dates yet.

Route to GAME-08.

## 14. Acceptance screenshots

Required:
1. `PLAYER SLOT 02 — IDENTITY DATA RECOVERED` with silhouette;
2. resolved Manu + `PLAYER 2 — MANU`;
3. Manu dialogue line;
4. `PARTY STATUS — 2/2`;
5. cooperative gate with both sprites;
6. 1366×768 full-frame reveal.
