# QA scripts (Playwright, Chromium)

Run against the dev server (`npx vite --port 5174`) unless noted; set
`PW` to the Playwright package path and `BASE` to override the URL.

| Script                               | What it checks                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `playthrough.mjs`                    | Full new save to SAVE SLOT: refresh at checkpoints, console, scroll, Friday locked, language gate. |
| `playthrough-paced.mjs`              | Same route at reading pace (duration measurement).                                                 |
| `boss-held-key.mjs`                  | Boss defeat menu with a held arrow opens on `REINTENTAR`.                                          |
| `boss.mjs`, `gate.mjs`, `reveal.mjs` | Scene captures (boss, co-op portal, Manu reveal).                                                  |
| `prod-smoke.mjs`                     | Production build with `--base=/save-slot-02/`.                                                     |

The dev-only hooks (`window.__desync`, `__seagull`, `__reveal`,
`__worldEngine`) do not exist in production builds.
