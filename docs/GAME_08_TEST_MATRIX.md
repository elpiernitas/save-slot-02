# GAME-08 — Test Matrix

## Calendar presentation
- three canonical selectable ids
- canonical display order
- Friday exists exactly once
- Friday selectable=false
- Friday theatre time 18:30

## Availability selector
- Sep 28: Wed/Thu/Sun available
- Sep 30 before/after day start: Wed allowed according to product rule
- Oct 1: Wed elapsed, Thu/Sun available
- Oct 2: past options unavailable, Friday still locked, Sun available
- Oct 4: Sunday available for that calendar day
- Oct 5: no selectable routes
- device timezone does not change Madrid result

## Reducer
- first date/choose sets id
- chosenAt set
- duplicate choose same id no-op
- attempt to overwrite with different id no-op
- timestamps only touch on first choice
- save version unchanged

## Scene
- highlight does not persist
- confirmation BACK does not persist
- YES persists
- selected option remains visible during confirmation
- Friday cannot open YES confirmation
- Escape behavior correct
- mouse resting pointer does not steal keyboard selection

## Persistence
- refresh after choose
- CONTINUE routes forward appropriately
- chosen date is readable by GAME-09

## QA
- 1920×1080
- 1440×900
- 1366×768
- reduced motion
- no scroll
- console clean
