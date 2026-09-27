# GAME-11 — Test Matrix

## Audio engine
- unlock unsupported
- unlock success
- unlock failure safe
- mute
- channel volume
- playMusic before unlock ignored
- switch track
- stop/fade
- scheduler cleanup
- repeated track call does not duplicate loop
- visibility/tab resume safe

## Music routing
- startup
- title
- muralla
- puzzle
- boss
- reveal/ending
- saveSlot

## SFX
- all referenced ids registered
- no content references missing id

## Motion
- reduced-motion transitions
- standard transitions
- no input during transition

## Achievements if implemented
- first unlock
- duplicate no-op
- hidden display

## Production hygiene
- no dev world handle in production
- no devScene in production
- no player-facing placeholder strings
- assets decode
- console clean full run
