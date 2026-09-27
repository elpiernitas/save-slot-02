# GAME-08 — Date Gate / Real-World Choice

Status: **PREPARED / BLOCKED UNTIL GAME-07 ACCEPTANCE**

## 1. Product goal

Convert the hidden side quest into a real-world choice without turning the
ending into a form.

The player should realise, late and clearly:

> the game was preparing an actual date invitation.

The choice must feel like a game-space reward.

## 2. Authoritative dates

Use only the canonical data in `src/game/calendar/calendar.ts`.

Selectable:
- Wednesday 30 September 2026
- Thursday 1 October 2026
- Sunday 4 October 2026

Visible but locked:
- Friday 2 October 2026
- `MAIN QUEST ALREADY ACTIVE`
- theatre starts at 18:30

Do not hard-code duplicate date logic inside UI components.

## 3. Scene

Use existing scene id:
`dateGate`

Presentation:
three/selectable destination gates plus the locked Friday gate.

Possible metaphor:
- save portals;
- city exits;
- departure board + portals.

Preferred final:
**four city gates / route terminals** in a simple night/sunset system-space,
where three are available and Friday is already occupied by a glowing
existing quest.

Avoid:
- calendar form;
- radio buttons;
- Typeform-style questionnaire;
- hearts everywhere.

## 4. Entry beat

After PLAYER 2 reveal/co-op gate:

`FINAL SIDE QUEST DATA RECOVERED`

Then:
`SELECT DESTINATION`

Only now should the nature of the reward become explicit.

A short line from Manu/narrator may reveal:
this is choosing when to meet.

Keep it playful, not ceremonial.

## 5. Date option model

Use:
- `DATE_OPTIONS`
- `MAIN_QUEST_ALREADY_ACTIVE`
- `getDateOption`
- `isDateOptionId`

Do not introduce a second date registry.

## 6. Save action

Existing:
```
dateQuest: {
  chosenOptionId: DateOptionId | null
  chosenAt: IsoTimestamp | null
}
```

Add reducer action:

```ts
{ type: 'date/choose'; option: DateOptionId; at: string }
```

Rules:
- only valid canonical DateOptionId;
- first confirmed choice wins;
- once chosen, reducer refuses overwrite;
- sets chosenAt;
- refresh preserves;
- no save-version bump.

Changing date later is not part of the game flow.

If Manu later needs a manual reset, that remains a full save reset/dev action,
not a visible "change date" button.

## 7. Selection state

Local scene state may move between gates.

Do not write choice to save on highlight.

Flow:
- navigate;
- inspect;
- confirm panel;
- YES writes save;
- BACK returns to selection.

After save commit, no accidental cancellation.

## 8. Gate contents

Each selectable gate should show:
- weekday;
- day/month;
- minimal flavour.

Examples of flavour tone:
- WED 30 SEP — `MIDWEEK ROUTE`
- THU 01 OCT — `ALMOST WEEKEND`
- SUN 04 OCT — `SUNDAY SIDE QUEST`

These are optional and can be rewritten.

Do not promise specific activities that have not been agreed.

## 9. Friday gate

Friday must be visible because it makes the system feel aware of the real
schedule.

Visual:
- already active;
- brighter or occupied;
- not selectable.

Text:
`FRI 02 OCT`
`MAIN QUEST ALREADY ACTIVE`
`18:30 — THEATRE`

Do not make Friday look like an error/disabled bad option.

It is an existing plan, not rejection.

## 10. Interaction

Keyboard:
- Left/Right or A/D selects gate;
- Enter/Space opens confirmation;
- Escape closes confirmation or returns only before a date is committed.

Mouse:
- hover/move selects;
- click confirm;
- resting pointer does not steal keyboard selection.

## 11. Confirmation

Example:

`LOCK THIS ROUTE?`
`THURSDAY · 01 OCT`

- YES
- BACK

After YES:
- dispatch `date/choose`;
- play save/confirm SFX;
- transition to GAME-09.

Do not require a second confirmation.

## 12. Class / choice variation

Class may alter one flavour line.

Prior choices/cards should not change date availability.

All three selectable dates remain equally valid.

## 13. Time correctness

The choice is offered regardless of device timezone.

All labels come from canonical Madrid-date data.

If the game is opened after one of the candidate dates has passed before Luis
chooses, GAME-12/release logic needs a graceful fallback.

Preferred release behaviour:
- because launch is 28 Sep and play is expected immediately, keep canonical
  options;
- additionally validate at runtime and mark past selectable dates unavailable
  if necessary;
- never allow choosing a past date.

This edge case must be specified/tested before production.

## 14. Past-date fallback

Add a pure selector:

```ts
getAvailableDateOptions(now: Date): ...
```

Rules:
- compare in Europe/Madrid;
- canonical future/today dates selectable;
- past dates visible as elapsed/unavailable or hidden according to final UI;
- Friday remains existing quest;
- if all selectable dates passed, show a graceful `ROUTES EXPIRED` state
  with a simple fallback message rather than broken UI.

Because launch timing is known, do not overbuild rescheduling.

## 15. Visual direction

Scene should feel special but remain within V2 UI system.

Use:
- deep navy;
- coastal night/sunset background;
- warm gate lights;
- cream text;
- class accent only subtly.

PLAYER 1 and PLAYER 2 may appear together at bottom/side of scene.

The visual focus is the routes, not romance iconography.

## 16. Audio

Synth/generated:
- navigation;
- gate focus;
- unavailable;
- confirmation;
- save lock.

Music can be added in GAME-11.

## 17. Tests

- canonical options render in canonical order
- Friday visible + not selectable
- date/choose stores id/time
- duplicate choose no-op
- invalid id blocked at type/content boundary
- refresh preserves chosen option
- confirmation does not save early
- mouse/keyboard
- past-date selector in Madrid
- launch-day state
- after-Wed state
- after-Thu state
- after-all-options state
- Friday never becomes selectable
- class flavour does not affect availability

## 18. QA

Required:
- 1920×1080 keyboard
- 1440×900 mouse
- 1366×768
- test fixed clocks for Sep 28, Sep 30, Oct 1, Oct 4, Oct 5
- refresh after confirmed date
- no scroll
- no console errors

## 19. Acceptance

GAME-08 passes when:
- choice feels like game UI, not a web form;
- real date purpose is clear;
- Friday's existing theatre plan is represented accurately;
- date cannot be accidentally overwritten;
- time edge cases do not break scene;
- GAME-09 can rely on chosenOptionId.

## 20. NEXT

**GAME-09 — ending + save slot**
