# HANDOFF

> Léeme primero. Resumen para que una sesión nueva continúe sin contexto previo.
> Después: `docs/GAME_CONSTITUTION.md` (reglas) y `docs/DECISION_LOG.md` (por qué).

**Última fase cerrada:** GAME-02 — motor de diálogos retro + hardening (2026-09-25)
**Próxima fase:** **GAME-03 — selección de clase**

> Recordatorios: el juego es **desktop-first** (D-017). UI/sistema en inglés
> retro, **diálogo de personajes en español** (constitución §7b).

## Estado del repositorio

- Rama `claude/save-slot-02-game-00-5tw0pw`, PR #1 (borrador) contra la rama
  por defecto `anthropich/claude-code-cloud`. Contiene GAME-00 + GAME-01 +
  GAME-02. No mergeado. Sin CI configurado en el repo.
- `npm run check` pasa: typecheck, lint, format:check, 188 tests (22
  archivos), build (~269 kB JS / 85 kB gzip).

## Qué hay hecho

### GAME-00 y GAME-01 (resumen)

Base Vite + React + TS estricto; save versionado (v2) con migraciones;
tiempo Europe/Madrid; condiciones; gate de pantalla (móvil bloqueado, ventana
< 800×450); fullscreen; arranque systemCheck → boot → saveDetected → title;
input por capas (teclado + ratón); transiciones; Pixelify Sans; SFX
sintetizados.

### GAME-02

- **Hardening:** `SceneRenderer` y `DisplayGate` sin setState en render
  (vista pura + temporizadores / latch actualizado desde eventos);
  fullscreen reintenta sin `navigationUI`; `settings/update` con merge
  profundo (`SettingsPatch`).
- **Motor de diálogo** (`src/game/dialogue/`):
  - `types.ts` contrato (grafo serializable), `markup.ts` (markup seguro),
    `typewriter.ts` (timeline, velocidades, pausas, blips, confirmación),
    `runtime.ts` (runtime puro), `effects.ts` (efectos → juego, recording
    host), `validate.ts` (validador), `portraits.ts` (composición).
  - `ui/`: `useDialogue` (controlador), `useTypewriter` (rAF),
    `DialoguePlayer`, `DialogueBox`, `DialogueText`, `Portrait`,
    `dialogue.css`.
- **Contenido** (`src/game/content/`): `cast.ts` (ARCHIVERO, SYSTEM),
  `portraits.ts` (CRT original, 6 expresiones + `off`),
  `dialogue/demo.ts` (demo en español, validada por test).
- **Escena** `dialogueDemo` (dev, no reanudable), abierta desde CONTINUE vía
  `CONTINUE_OVERRIDE` en `src/game/scenes/flow.ts`; al terminar vuelve al
  título.
- **SETTINGS:** FULLSCREEN, SOUND, TEXT SPEED, MOTION, BACK.
- **Audio:** voces por hablante (`VOICE_BLIPS`), blips limitados a 1/65 ms.

## Qué NO está hecho (a propósito)

- Selección de clase → **GAME-03**. Mapa, inventario/cartas reales, puzzles,
  boss, Player 2, fechas/portales, final, historia → fases posteriores.
- Efectos `giveItem`, `takeItem`, `giveCard`, `setQuest`: marcados como
  `unsupported` hasta GAME-04/05.
- Retratos definitivos de personajes reales: no diseñados.
- Música (GAME-11). Supabase, backend, Phaser: no instalados. Sin despliegue.

## QA realizada / pendiente

- Chromium headless (Playwright) a 1920×1080, 1440×900, 1366×768 y ventana
  pequeña: demo completa por teclado (Enter, S/↓, Escape) y ratón; 14–15
  páginas sin desbordes (máx. 2 líneas); opción bloqueada visible y saltada,
  opción oculta ausente; flag, elección y logro guardados; tras refresh la
  demo cambia según la elección previa; TEXT SPEED INSTANT y MOTION OFF
  aplicados; mantener Enter ~1 s avanza una sola página; el gate bloquea el
  input durante el diálogo; consola sin errores ni warnings.
- **Pendiente en máquina real:** escuchar los blips (headless no reproduce
  audio), fullscreen real y el reintento sin opciones, Safari/Firefox.

## Archivos importantes

| Archivo                                        | Para qué                                |
| ---------------------------------------------- | --------------------------------------- |
| `src/game/dialogue/types.ts`                   | contrato de diálogo                     |
| `src/game/dialogue/runtime.ts`                 | runtime puro                            |
| `src/game/dialogue/effects.ts`                 | efectos → reducer/audio/acciones        |
| `src/game/dialogue/markup.ts`, `typewriter.ts` | markup y tiempos                        |
| `src/game/dialogue/validate.ts`                | validación de scripts                   |
| `src/game/dialogue/ui/DialoguePlayer.tsx`      | componente a usar en escenas            |
| `src/game/content/{cast,portraits}.ts`         | hablantes y retratos                    |
| `src/game/content/dialogue/demo.ts`            | ejemplo completo de script              |
| `src/game/scenes/flow.ts`                      | `CONTINUE_OVERRIDE` (quitar en GAME-03) |
| `src/game/scenes/sceneTransition.ts`           | vista pura de la transición             |
| `src/game/state/settingsOptions.ts`            | opciones y mapeo de TEXT SPEED / MOTION |
| `src/game/state/gameReducer.ts`                | acciones + `mergeSettings`              |
| `src/game/scenes/title/SettingsPanel.tsx`      | panel de ajustes                        |

## Próximo paso exacto

**GAME-03 — selección de clase**

1. Diseñar las clases (idea en la constitución: guerrero / tanque / curador u
   otras) y estrechar `PlayerClassId` (migración si cambia el save).
2. Crear la escena `classSelect` y registrarla; presentación con
   `DialoguePlayer` (diálogo en español) + menú de clases con `useMenu`.
3. Acción de reducer para fijar clase (y nombre si procede); CONTINUE debe
   reanudar en la escena correcta: poner `CONTINUE_OVERRIDE` a `null` y
   decidir si `dialogueDemo` se retira del flujo.
4. Tests (reducer, flujo, script validado) y QA en Chromium.
5. `npm run check`, actualizar HANDOFF, ROADMAP y DECISION_LOG.
