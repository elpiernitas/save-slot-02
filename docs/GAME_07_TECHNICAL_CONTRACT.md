# GAME-07 — Technical Contract

Status: implementation-level contract.

This file translates GAME-07 design into concrete source-code responsibilities
without requiring a new engine.

## 1. Existing systems to reuse

Reuse:
- `InputRouter`;
- scene registry;
- `GameContext.dispatch`;
- current save/autosave;
- current audio engine;
- current reduced-motion hook;
- current menu/input patterns.

Do not reuse the street `WorldEngine` merely for consistency.

Boss can be its own deterministic scene runtime.

## 2. Save commands

Extend `GameAction`:

```ts
| { type: 'boss/attempt'; at: string }
| { type: 'boss/defeat'; at: string }
```

### boss/attempt

```ts
boss: {
  ...save.boss,
  attempts: save.boss.attempts + 1
}
```

Do not increment if boss is already defeated.

### boss/defeat

If already defeated:
return same save.

Else:
```ts
boss: {
  defeated: true,
  attempts: Math.max(1, save.boss.attempts),
  defeatedAt: action.at
}
```

Then touch timestamps.

## 3. Reveal flag

Use existing generic flags:

```ts
'story.player2Found' = true
```

No new save interface field.

Optional cooperative-gate completion flag:

```ts
'story.player2GateComplete' = true
```

Only add if routing genuinely needs to distinguish "identity shown" from
"co-op gate completed".

## 4. Resume routing

Boss/reveal are resumable scenes under current `isResumableScene`.

Add pure routing helpers in `scenes/flow.ts` or a GAME-07-specific module.

Desired rules:

```
if !boss.defeated:
  boss

if boss.defeated && !player2Found:
  player2Reveal

if player2Found && !player2GateComplete:
  player2Reveal (resume/co-op stage)

if player2GateComplete:
  dateGate
```

Do not rely solely on the previous `resumeSceneId` when save state proves a
later stage has already completed.

Reason:
refresh/crash during reveal must never replay boss or strand the player.

## 5. Boss runtime state

Suggested:

```ts
type BossPhase = 'checksum' | 'signalSplit' | 'missingChannel' | 'defeated' | 'failed'

interface DesyncState {
  phase: BossPhase
  phaseStartedAt: number
  integrity: 0 | 1 | 2 | 3
  invulnerableUntil: number
  nodes: {
    a: number
    b: number
    c: number
  }
  activeHazard: HazardInstance | null
  patternIndex: number
  attempt: number
  assist: boolean
  player: {
    x: number
    y: number
    facing: Facing
  }
}
```

Transient only.

Do not put this in GameSave.

## 6. Boss transition API

Keep state transitions pure where practical:

```ts
createBossAttempt(config): DesyncState
advanceBoss(state, dt, input, now): DesyncState
applyBossHit(state, now): DesyncState
stabiliseNode(state, node): DesyncState
isBossComplete(state): boolean
```

Renderer/UI reads state.

Scene owns:
- RAF scheduler;
- input layer;
- SFX side effects;
- dispatching attempt/defeat;
- scene transition.

## 7. Attempt lifecycle

On first actual playable frame of a new attempt:
dispatch `boss/attempt` once.

Do not dispatch:
- on render;
- on every retry-menu open;
- on visibility change.

Retry:
create fresh transient state then dispatch one new attempt.

Refresh:
if boss not defeated, a new page-load attempt may count as a new attempt once
actual boss gameplay starts. This is acceptable and deterministic.

## 8. Input priority

Boss scene:
`INPUT_PRIORITY.scene`

Retry / assist menu:
`INPUT_PRIORITY.panel`

Reveal scene:
`INPUT_PRIORITY.scene`

Dialogue inside reveal:
existing DialoguePlayer layer takes precedence.

Any scene transition:
existing blocker layer wins.

## 9. Movement input

Boss movement may poll `router.heldDirection()` similarly to WorldEngine.

Only move when boss scene input handler owns top scene input.

When menu/dialogue opens:
movement must stop immediately.

On blur:
existing router releaseAll handles stuck directions.

## 10. Collision

Use simple arena rectangles.

PLAYER collision:
small foot/body box.

Hazards:
AABB or circle/rect tests only.

No physics library.

No per-pixel collision.

## 11. Pattern scheduler

Use authored timeline from `GAME_07_BOSS_PATTERN_SPEC.md`.

Recommended representation:

```ts
interface PatternStep {
  kind: HazardKind
  telegraphMs: number
  activeMs: number
  recoveryMs: number
  params: ...
}
```

A phase owns readonly pattern steps.

Loop until the phase objective is complete.

Do not generate runtime random numbers for release patterns.

## 12. Rendering

Preferred:
Canvas 2D for arena/hazards/player.

React overlays:
- SIGNAL counter;
- phase/system labels;
- retry menu;
- assist offer.

Do not put DOM nodes inside the canvas.

Render order:
1. arena;
2. telegraphs;
3. active hazards;
4. nodes;
5. player;
6. lightweight FX;
7. React HUD/panels.

## 13. Reduced motion

Boss runtime receives:
`reducedMotion: boolean`

It changes cosmetic effects only where possible.

Gameplay timing stays equivalent except assist mode.

If a visual motion is itself the hazard:
keep the hazard but remove unnecessary trailing/glitch animation.

## 14. Reveal scene state

Suggested local state:

```ts
type RevealStep =
  | 'scan'
  | 'signalFound'
  | 'slot'
  | 'identity'
  | 'line'
  | 'partyStable'
  | 'coop'
  | 'complete'
```

Transitions:
- timer/callback driven;
- Enter/Space can fast-forward non-gameplay reveal steps;
- no setState during render;
- reduced motion shortens visual transitions.

## 15. Cooperative gate state

Pure tiny machine:

```ts
type GateState =
  | { step: 'waitingPlayer1' }
  | { step: 'movingPlayer2'; progress: number }
  | { step: 'player2Ready' }
  | { step: 'opening' }
  | { step: 'done' }
```

PLAYER 1 interaction moves first state forward.

Manu animation completion or reduced-motion snap moves to `player2Ready`.

Never depend exclusively on a DOM transitionend event.

Use time/state fallback.

## 16. Scene registry

When implemented:
register:
- `boss`;
- `player2Reveal`.

Do not register `dateGate` implementation inside GAME-07.

## 17. Dev QA access

Development-only query jump can be extended carefully.

Possible:
`?devScene=boss`
`?devScene=player2Reveal`

But current `DEV_SCENES` only permits dialogueDemo.

If adding GAME-07 dev jumps:
- use separate debug resolver;
- ensure production build ignores them;
- do not mark real gameplay scenes as non-resumable by putting them in
  `DEV_SCENES`.

## 18. Audio

Use existing SFX IDs as strings.

Boss content can define:
- `desync.warning`
- `desync.hit`
- `desync.node`
- `desync.phase`
- `desync.scan`
- `desync.found`
- `desync.link`
- `desync.gate`

Current WebAudio synth may map these to generated sounds.

No asset files required.

## 19. Error safety

If boss visual asset fails:
- arena still renders minimal safe geometry;
- gameplay remains visible.

If Manu asset fails:
- reveal should log error and display an explicit controlled placeholder,
  not crash.

Release gate still requires final approved Manu visual.

## 20. Testability

Inject:
- scheduler/clock where useful;
- authored pattern data;
- collision functions.

Do not make unit tests wait on real timers.

Browser QA covers integration/timing feel.
