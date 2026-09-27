---
name: save-slot-art-request
description: Use when Claude needs a new or replacement visual asset for SAVE SLOT 02 and should request it from ChatGPT rather than improvising final art or spending paid generation credits.
---

# SAVE SLOT 02 — Art Request Skill

## Purpose

Claude should keep implementing the game, but when an approved visual asset is
missing, it can create a precise request for ChatGPT in PR #1.

## Never

- spend paid image-generation credits without Manu approval;
- substitute generic stock art;
- invent a new art style;
- rebuild final art procedurally merely because image generation is unavailable.

## Before requesting

Read:
- docs/IMAGE_GENERATION_PROMPTS.md
- docs/ASSET_MANIFEST_V2.md
- docs/CHARACTER_ASSET_SPEC.md
- docs/ART_DIRECTION_V1.md
- active phase spec

Check whether an existing reference/runtime asset already solves the need.

## PR request format

Post:

```
## ART REQUEST — <asset id>

Phase:
Blocking: yes/no
Runtime or reference:
Target path:
Target dimensions/frame grid:
Transparent: yes/no

Purpose:
...

Must show:
- ...

Must not show:
- ...

Runtime constraints:
- anchor...
- collision...
- layering...

References:
- repo/path
- repo/path

What I can continue implementing while waiting:
...
```

## Important

A missing non-critical final asset should not stop unrelated code.

Use a replaceable placeholder consistent with approved palette/scale and
continue.

If the missing art blocks visual acceptance, finish all surrounding
integration/tests first, then leave the focused ART REQUEST.

## Receiving art

When ChatGPT adds/replaces the asset:
1. pull latest branch;
2. validate PNG/manifest;
3. integrate anchors/colliders;
4. run npm run art:check;
5. run npm run check;
6. screenshot;
7. request visual review.
