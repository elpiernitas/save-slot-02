# GAME-09 — Test Matrix

## Completion
- first game/complete
- duplicate game/complete no-op
- completedAt stable
- chosenOptionId preserved
- chosenAt preserved

## Flow
- no chosen date cannot legitimately enter ending
- chosen date → ending
- ending → saveSlot
- refresh during ending safe
- resume after completion → saveSlot
- title CONTINUE after completion → saveSlot

## SaveSlot
- player name
- class
- PLAYER 2 status
- complete status
- date route label for all options
- cards entry if supported
- settings entry
- no accidental reset

## Visual
- first-completion animation
- subsequent visit skips long animation
- reduced motion
- 1366×768
- no overflow
- no scroll

## Audio
- muted path
- save/completion sfx only once as intended

## QA
Seed all three date choices and compare status output.
