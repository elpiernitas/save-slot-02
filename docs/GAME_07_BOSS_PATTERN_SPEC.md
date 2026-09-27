# GAME-07 — DESYNC Boss Pattern Specification

Status: authoritative encounter tuning for implementation.

This document narrows GAME-07 to a release-safe boss that is short, readable
and mechanically meaningful.

## 1. Release target

Successful run:
**75–95 seconds**

First clear including one failure:
**2–4 minutes**

Do not extend the fight to create spectacle.

Minimum release version:
- one arena;
- three stabiliser nodes;
- two core hazard families;
- three phases;
- three-strike integrity;
- deterministic sequence;
- assist mode.

## 2. Arena

Logical boss arena:
**640×360**

Safe playable rectangle:
approximately:
- x: 88–552
- y: 58–306

PLAYER 1:
- use readable simplified boss-space sprite or normal overworld sprite;
- collision footprint smaller than visible body;
- speed target approximately 105–120 px/s.

Nodes:
- A: upper-left quadrant;
- B: upper-right quadrant;
- C: lower-centre.

Recovery core:
- centre.

The arena must never require diagonal precision through a one-sprite gap.

## 3. Integrity

Display:
`SIGNAL 3/3`

On hit:
- decrement by one;
- 900–1200 ms invulnerability;
- brief flicker/outline;
- no violent screen shake;
- no knockback required.

At 0:
`SIGNAL LOST`
then retry panel.

## 4. Telegraph timing

Normal mode baseline:

- warning lead: 700 ms
- danger active: 650 ms
- recovery gap: 450 ms

Fast pattern baseline:
- warning lead: 600 ms
- danger active: 550 ms
- recovery gap: 400 ms

Assist:
- multiply warning lead by ~1.30
- multiply hazard velocity by ~0.78
- keep active windows readable
- do not change story/rewards

Reduced motion:
- no continuous screen distortion;
- telegraph uses static bright outline/fill;
- moving sweeps may move normally because they are gameplay objects, but
  ambient glitch/parallax must stop.

## 5. Pattern vocabulary

Release uses two primary hazards plus one simple final pulse.

### HZ-01 — BAR SWEEP

A vertical or horizontal rectangular band crosses the arena.

Telegraph:
- destination lane outlined first;
- arrow/chevrons show direction;
- shape, not colour alone.

Variants:
- left → right
- right → left
- top → bottom

Never use two intersecting sweeps in release build.

### HZ-02 — PULSE ZONES

2–4 rectangular/circular zones telegraph, then activate simultaneously.

Rules:
- always leave at least one large safe region;
- never spawn directly under PLAYER 1 without full warning;
- maximum 4 zones.

### HZ-03 — FINAL RING

Used once in Phase 3.

A central pulse expands or resolves in two clear beats.

Purpose:
create one final movement beat before interacting with recovery core.

No bullet projectiles.

## 6. Stabiliser interaction

Near active node:
`E — STABILISE`

Use tap/short repeated commit, not long hold.

Recommended node progress:
3 commits.

Each commit:
- 250–350 ms lock/animation;
- player may leave between commits;
- completed progress persists within attempt.

A hazard hit does not erase node progress.

## 7. Deterministic release sequence

Use a fixed authored sequence instead of random generation for the first
release.

### PHASE 1 — CHECKSUM

Goal:
Node A.

Sequence:
1. HZ-01 vertical sweep L→R
2. recovery
3. HZ-02 two pulse zones
4. recovery
5. HZ-01 horizontal top→bottom
6. repeat simple loop if Node A not yet stable

Expected duration:
20–25 s.

Node A completion immediately ends phase after current hazard resolves.

SYSTEM:
`NODE A — STABLE`

### PHASE 2 — SIGNAL SPLIT

Goal:
Nodes B and C.

Sequence loop:
1. HZ-02 three zones
2. HZ-01 sweep R→L
3. HZ-02 two zones biased toward last player position
4. HZ-01 sweep L→R

"Biased" must remain deterministic from a bounded player-position snapshot,
not RNG.

Expected duration:
35–45 s.

After first of B/C:
`1 CHANNEL REMAINS`

After both:
`PLAYER 1 SIGNAL — STABLE`

### PHASE 3 — MISSING CHANNEL

Duration:
15–20 s.

Display:
`PLAYER 1 — ACTIVE`
`PLAYER 2 — NO SIGNAL`

Sequence:
1. HZ-03 final ring
2. HZ-02 two simple zones
3. recovery core becomes active

At core:
`E — RECOVER INPUT`

Interaction triggers encounter completion.

No impossible fake PLAYER 2 input.

## 8. Failure / retry

On 0 integrity:
- freeze hazards;
- show `SIGNAL LOST`;
- menu:
  - RETRY
  - ASSIST MODE (if eligible)
  - RETURN TO TITLE

Retry:
- resets transient boss state;
- increments boss attempt exactly once when new run starts;
- skips long intro;
- 1–2 second restart maximum.

## 9. Assist threshold

Offer after:
**2 failed attempts**.

Reason:
deadline experience should not trap Luis.

Assist remains available thereafter.

Copy:
`ASSIST MODE AVAILABLE`
`Stabilise the signal with longer warnings.`

Options:
- ENABLE
- NOT NOW

No condescending text.
No reward penalty.

## 10. Class treatment

Release recommendation:
**flavour-only, not mechanics.**

Reason:
the fight is already a new interaction model and class-specific tuning adds
QA cost.

Phase-start SYSTEM microline:

GUERRERO:
`DIRECT ROUTE DETECTED.`

TANQUE:
`SIGNAL TOLERANCE: HIGH.`

CURADOR:
`RECOVERY ROUTE MAPPED.`

Do not alter actual difficulty by class unless implementation is trivial and
fully tested.

## 11. Completion

After recovery-core confirm:

1. stop hazard scheduler;
2. disable movement input;
3. resolve corruption layers into clean geometry;
4. persist `boss/defeat`;
5. wait only for the save dispatch/scene transition contract, not an arbitrary
   long cinematic;
6. show:

`DESYNC PROCESS — TERMINATED`

then:

`SCANNING FOR MISSING INPUT...`

then route to `player2Reveal`.

## 12. Timing correctness

Use delta time or absolute timestamps.

Do not base gameplay speed on frame count.

QA must simulate:
- 60 Hz;
- 120 Hz;
- 144 Hz or variable frame intervals.

## 13. Cut rule

If schedule is at risk, cut in this order:

1. decorative arena animation;
2. class-specific mechanics;
3. third/fourth hazard variants;
4. complex sound layering.

Never cut:
- telegraphs;
- retry;
- assist;
- 3 nodes;
- missing PLAYER 2 mechanical beat;
- reveal transition.
