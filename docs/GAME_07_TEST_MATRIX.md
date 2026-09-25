# GAME-07 — Test Matrix

## Save
- boss/attempt increments
- boss/defeat sets defeated/defeatedAt
- duplicate defeat no-op
- timestamps correct
- refresh after defeat skips boss

## Encounter
- initial phase
- phase 1 completion
- phase 2 completion
- phase 3 completion
- deterministic pattern sequence
- hazard warning before resolve
- collision hit
- invulnerability/recovery window
- three-strike failure
- retry resets transient state
- attempt count increments exactly once per new attempt

## Nodes
- inactive node cannot stabilise
- active node progresses
- leaving range stops/interrupts as designed
- node completion locks
- final recovery requires all PLAYER 1 nodes

## Class
If mechanical modifiers are used:
- warrior
- tank
- healer
- all remain beatable with same content

## Assist
- appears after threshold
- enable changes only difficulty values
- no reward/story penalty
- reduced motion compatible

## Reveal
- boss defeat routes player2Reveal
- reveal skipped/recovered correctly after refresh
- story.player2Found flag if used
- Manu asset resolves
- no date option shown yet

## Cooperative gate
- Luis side input
- scripted Manu side
- gate opens only after both
- cannot deadlock if animation interrupted/reduced motion
- refresh after reveal routes forward safely

## Browser QA
- 1920×1080 successful run
- 1440×900 failure/retry
- 1366×768 readability
- reduced motion
- fullscreen/window
- console clean
- no scroll
