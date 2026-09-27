# SAVE SLOT 02 — Release Risk Register

Target: 2026-09-28.

## R1 — GAME-04R art still looks like prototype
Severity: CRITICAL
Probability: medium/high
Mitigation:
- approved visual references are in repo;
- Claude integrates, does not redesign;
- reduce map quantity, not art quality;
- six screenshot acceptance gate.
Fallback:
- ship one excellent compact La Muralla scene rather than multiple mediocre
  areas.

## R2 — Too much scope before Monday
Severity: CRITICAL
Probability: high
Mitigation:
- `RELEASE_CRITICAL_PATH.md`;
- GAME-10 cuttable;
- GAME-05/06 minimum cuts defined;
- no new frameworks.

## R3 — Boss consumes too much implementation time
Severity: HIGH
Probability: medium
Mitigation:
- purpose-built deterministic arena;
- no combat engine;
- minimum version = 2 pattern types + 3 nodes + reveal.

## R4 — Date edge case after candidate dates
Severity: HIGH
Probability: low for launch, inevitable later
Mitigation:
- Madrid-time availability selector;
- expired-routes state;
- tests through Oct 5.

## R5 — External art replacement breaks art:check
Severity: RESOLVED
Mitigation:
- runtime art validator now checks manifest/dimensions/decoding;
- pixel-identity generator check separated into `art:check-generated`.

## R6 — Input leaks across overlays
Severity: HIGH
Probability: medium
Known history:
- same-frame stale handler bug;
- Enter after dialogue cooldown.
Mitigation:
- shared InputRouter priorities;
- layout effects;
- cooldown tests for every new overlay.

## R7 — Save regression
Severity: CRITICAL
Probability: medium
Mitigation:
- avoid save-shape changes;
- first-write-wins reducers;
- migrations only if unavoidable;
- refresh tests at each phase;
- final corrupt-save test.

## R8 — CI noise from planning markdown
Severity: LOW
Status: mitigated
Mitigation:
- Prettier CI focuses on runtime/config files;
- docs remain human-readable but do not block builds on wrapping differences.

## R9 — Audio autoplay/browser differences
Severity: MEDIUM
Mitigation:
- existing gesture unlock;
- silent play remains fully supported;
- GAME-11 music cuttable;
- Safari QA.

## R10 — Netlify deploy surprises
Severity: HIGH
Mitigation:
- config already present;
- CI build;
- incognito smoke;
- headers/network audit;
- rollback SHA.

## R11 — Personal content/privacy leak
Severity: HIGH
Mitigation:
- private repo;
- noindex;
- no analytics;
- no chat-log bundle;
- docs not imported by runtime;
- asset audit.

## R12 — Claude/ChatGPT drift
Severity: MEDIUM
Mitigation:
- PR is shared channel;
- PROJECT_INDEX;
- active milestone gates;
- ACCEPT/FIXES/NEXT protocol.

## Release principle

When a risk threatens schedule:
cut breadth before quality of the core path.
