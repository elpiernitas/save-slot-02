---
name: save-slot-release
description: Use for SAVE SLOT 02 GAME-12 production QA, CI, Netlify, privacy, browser compatibility, release smoke, rollback, or final release decisions.
---

# SAVE SLOT 02 — Release Skill

## Mission
Ship a reliable private link.

## P0
Core path, save, date choice, ending, CI, production smoke.

## Do not
Add new game features during release QA.

## Privacy
No tracking.
Noindex.
Private repo.
No secrets.
No source Street View runtime images.

## QA
Production build, real browsers, 1366×768, keyboard-only, refresh.

## Netlify
Use netlify.toml.
Verify headers after deploy.

## Rollback
Record release SHA and keep last good deploy.

## Owner
Only involve Manu for final visual/send decisions, not routine QA.
