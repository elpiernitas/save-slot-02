# GAME-10 — Post-game Unlocks

Status: **PREPARED / OPTIONAL UNTIL CORE GAME IS SHIPPABLE**

GAME-10 is intentionally small and cuttable.

## 1. Product goal

Make the URL feel like a persistent save rather than a one-use page after the
date is chosen.

Do not build a live service.

No backend is required.

## 2. Priority

P0:
- chosen-date countdown/status on final save slot;
- safe behaviour before/on/after chosen date.

P1:
- one tiny post-game unlock;
- CITY CARDS access.

P2:
- extra easter eggs.

If deadline is tight, ship only P0.

## 3. Dynamic date status

Use existing Europe/Madrid calendar helpers.

Final save slot may derive:

### Before chosen date
`NEXT QUEST — 3 DAYS`

or:
`DATE ROUTE — THU 01 OCT`

### Day before
`NEXT QUEST — TOMORROW`

### Chosen date
`MAIN QUEST — TODAY`

### After date
Do not claim what happened in real life.

Use:
`DATE ROUTE — ELAPSED`

or:
`SAVE SLOT — CONTINUES`

Never:
- `DATE COMPLETE`
- `SUCCESS`
unless a player explicitly records it.

## 4. Time gates

Reuse `TimeGate`:
- relativeToChosenDate
- onDate / date comparisons
- fromDate

Do not create a second scheduling system.

## 5. Unlock persistence

Existing:
```ts
unlocks: Record<UnlockId, { unlockedAt: IsoTimestamp }>
```

Add only if a persistent first-open timestamp is useful:

```ts
{ type: 'unlock/grant'; unlock: UnlockId; at: string }
```

First grant wins.

Do not persist dynamic date labels that can be derived from current time.

## 6. Tiny unlock

Preferred single post-game unlock:

**SAVE LOG**

A small menu entry that appears after completion and shows:
- chosen route;
- a few CITY CARDS;
- one short system note.

Alternative:
a Randy cameo on saveSlot after a small time gate.

Do not add both unless core schedule is safe.

## 7. Randy cameo option

If used:
- purely visual/interactive;
- Randy appears sitting near the save-slot art;
- one interaction line;
- no plot consequence.

Possible copy:
`Randy has no idea what any of this means.`

This can unlock immediately after completion or later.

## 8. Countdown

No live ticking seconds.

Update at day granularity, or hour granularity only on chosen day.

Avoid compulsive countdown UX.

## 9. Offline/local nature

Everything remains localStorage + current clock.

No notifications.
No email.
No tracking.

## 10. Tests

- before date
- day before
- chosen day
- after date
- Madrid timezone
- DST around Oct 2026 where relevant
- unlock/grant first-write-wins if implemented
- post-game menu appears only after completion
- no false claim of real-world completion

## 11. Acceptance

P0 passes when:
- saveSlot stays correct across the selected date;
- no stale countdown;
- no impossible/past UI;
- no claim about what happened offline.

## 12. NEXT

GAME-11 polish.
