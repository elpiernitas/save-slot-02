---
name: save-slot-date-gate
description: Use for SAVE SLOT 02 GAME-08 date portals, canonical date selection, Friday locked quest, Madrid-time availability, confirmation, or date persistence.
---

# SAVE SLOT 02 — Date Gate Skill

## Gate
Implement only after GAME-07 ACCEPT.

## Source of truth
`src/game/calendar/calendar.ts`

Never duplicate canonical dates in component logic.

## Dates
Selectable:
- 30 Sep 2026
- 1 Oct 2026
- 4 Oct 2026

Friday 2 Oct:
visible, locked, theatre 18:30.

## Product
This is a game scene, not a questionnaire.

Save only after explicit confirmation.

First choice wins.

## Time
Evaluate expiry in Europe/Madrid.

Never allow a past date.

## Tone
Late reveal, playful, short.

No giant romance copy.

## Next
End at GAME-09.
