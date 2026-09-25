# GAME-06 — Test Matrix

Status: prepared.

## Puzzle completion state

- complete puzzle first time
- attempts stored
- completedAt stored
- duplicate completion no-op
- timestamps only touched on first completion
- puzzleCompleted condition true/false
- save version unchanged if JSON shape unchanged

## Route Beacons

- initial state
- correct first beacon
- correct second beacon
- full success
- wrong beacon resets progress
- wrong increments runtime attempt
- replay hint does not alter solution
- reduced-motion pulse representation remains readable
- completed puzzle does not retrigger mandatory flow

## Seagull Protocol

- deterministic seed produces stable pattern
- warnings precede hit zones
- movement collision/hit logic deterministic
- hit resets/reduces run according to chosen implementation
- leave returns cleanly
- clear completes optional result
- reward only once
- reduced motion
- no audio dependency

## Sync Terminal

- cursor movement
- tile/node rotation
- solved PLAYER 1 path
- unsolved path cannot complete early
- PLAYER 2 side is visibly unavailable
- fallback confirmation only after PLAYER 1 solve
- completion sets puzzle result
- missing-player flag/branch set once
- Escape rules before/after final lock

## PuzzleHost

- captures input above world
- world paused
- dialogue cannot open underneath
- closing applies cooldown
- retry does not remount unrelated world state
- unmount cleans input layer
- StrictMode no duplicate handlers

## Multi-map, if implemented

- checkpoint parser
- muralla checkpoint → muralla map
- cholo checkpoint → cholo map
- transition saves target checkpoint
- refresh resumes target map/spawn
- invalid map id falls back safely
- engine destroyed before new map engine starts
- no stale renderer/input subscriptions

## Rewards

- route reward once
- seagull reward once
- sync puzzle no forced collectible
- duplicate replay does not duplicate card/item

## Browser QA

1920×1080:
- full keyboard route

1440×900:
- mouse interactions where applicable

1366×768:
- readable symbols and terminal UI

All:
- wrong attempt then recovery
- optional leave
- refresh after PZ-01
- refresh after PZ-02
- no body scroll
- console clean
- no stuck keys/input
