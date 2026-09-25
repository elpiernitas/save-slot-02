# HANDOFF

> Léeme primero. Resumen para que una sesión nueva continúe sin contexto previo.
> Después: `docs/GAME_CONSTITUTION.md` (reglas), **`docs/WORLD_BIBLE.md`
> (universo)** y `docs/DECISION_LOG.md` (por qué).

**Última fase cerrada:** GAME-03 — world bible + selección de clase (2026-09-25)
**Próxima fase:** **GAME-04 — mundo explorable / vertical slice de Gijón**

> Recordatorios: desktop-first (D-017). UI/sistema en inglés retro, diálogo en
> español (§7b). El mundo es un **Gijón cotidiano gamificado**, no siempre de
> noche, pixel art moderno (D-040, WORLD_BIBLE).

## Estado del repositorio

- Rama `claude/save-slot-02-game-00-5tw0pw`, PR #1 (borrador) contra la rama
  por defecto `anthropich/claude-code-cloud`. Contiene GAME-00 → GAME-03. No
  mergeado. Sin CI configurado en el repo.
- `npm run check` pasa: typecheck, lint, format:check, 222 tests (25
  archivos), build (~280 kB JS / 89 kB gzip).
- `SAVE_VERSION` sigue en **2** (GAME-03 no cambió la forma JSON).

## Qué hay hecho

### GAME-00 → GAME-02 (resumen)

Base Vite + React + TS; save versionado con migraciones; tiempo
Europe/Madrid; gate de pantalla; fullscreen; arranque systemCheck → boot →
saveDetected → title; input por capas; motor de diálogo completo
(runtime puro, markup, typewriter, voces, elecciones, validador, retratos);
SETTINGS (fullscreen, sonido, velocidad de texto, movimiento).

### GAME-03

- **Creativo:** `docs/WORLD_BIBLE.md` (tono, Gijón, franjas del día, estilo,
  paleta, personajes, clases, tarot, música). Constitución enlazada y
  actualizada (D-040, D-041).
- **Clases:** `src/game/player/classes.ts` — GUERRERO / TANQUE / CURADOR,
  tipo cerrado, `PlayerClassDefinition`, `hasPlayerClass`.
- **Estado:** acción `player/assignClass` (permanente, completa
  `classSelect`), condición `playerClass`, normalización de clases
  desconocidas al cargar.
- **Escena `classSelect`:** máquina pura (`classSelectMachine.ts`) + UI de
  tarjetas con sigilos, panel de detalle con silueta genérica, confirmación
  diegética (ASSIGN CLASS / ¿CONFIRMAR? / SÍ / VOLVER), diálogos en
  `content/dialogue/classSelect.ts` (intro + micro-demo por clase).
- **Flujo:** TITLE → classSelect → `overworld` provisional
  (`WorldLoadingScene`, "LOADING WORLD..."). `CONTINUE_OVERRIDE` eliminado;
  `dialogueDemo` solo en dev con `?devScene=dialogueDemo`.
- **Input:** handlers y capas en `useLayoutEffect`; hover por `mousemove`
  (bug de QA corregido, D-046).
- **Paleta:** tokens `--world-*` y acentos de clase en `tokens.css`.

## Qué NO está hecho (a propósito)

- Mundo explorable, mapa de Gijón, lugares concretos, NPCs → **GAME-04**.
- Sprites/retratos de Luis, Manu y Randy: **esperan referencias visuales de
  Manu**. Solo hay sigilos abstractos y una silueta genérica.
- Contenido real dependiente de clase (solo la micro-demo del final de
  classSelect).
- Inventario, cartas, puzzles, boss, Player 2, fechas, OST, Phaser, backend.

## QA realizada / pendiente

- Chromium headless (Playwright) a 1920×1080 (ruta de fullscreen), 1440×900
  (solo ratón), 1366×768 (teclado) y ventana pequeña: las tres clases
  asignadas al menos una vez; ←→/A-D con wrap, hover, Escape al título sin
  guardar, Escape/VOLVER en la confirmación, nada guardado antes de SÍ;
  diálogo por clase correcto; refresh → CONTINUE va directo a `overworld`
  sin volver a pedir clase; `?devScene` ignorado en producción y operativo en
  dev; sin desbordes ni scroll; consola limpia (también en dev/StrictMode).
- Pendiente en máquina real: fullscreen real, audio audible,
  Safari/Firefox.

## Archivos importantes

| Archivo                                             | Para qué                                    |
| --------------------------------------------------- | ------------------------------------------- |
| `docs/WORLD_BIBLE.md`                               | **fuente de verdad creativa para GAME-04+** |
| `src/game/player/classes.ts`                        | clases y helpers                            |
| `src/game/scenes/classSelect/classSelectMachine.ts` | lógica de la selección                      |
| `src/game/scenes/classSelect/ClassSelectScene.tsx`  | UI de la selección                          |
| `src/game/scenes/overworld/WorldLoadingScene.tsx`   | `overworld` provisional (sustituir en 04)   |
| `src/game/scenes/flow.ts`                           | rutas: CONTINUE, classSelect, dev query     |
| `src/game/content/dialogue/classSelect.ts`          | diálogos de la selección                    |
| `src/game/content/sigils.ts`                        | sigilos y silueta genérica                  |
| `src/game/state/conditions.ts`                      | condición `playerClass`                     |
| `src/game/state/gameReducer.ts`                     | `player/assignClass`                        |
| `src/game/dialogue/ui/DialoguePlayer.tsx`           | diálogos en escenas                         |
| `src/styles/tokens.css`                             | paleta `--world-*`                          |

## Próximo paso exacto

**GAME-04 — mundo explorable / vertical slice de Gijón**

1. Releer `WORLD_BIBLE.md` y elegir **una** zona y **una** franja horaria
   para el vertical slice (sin diseñar todo Gijón).
2. Decidir y documentar el motor de exploración (canvas/React propio vs
   Phaser) y reevaluar la resolución lógica 480×270 con arte real.
3. Movimiento con teclado, colisiones, cámara, interacción con NPCs/objetos
   usando `DialoguePlayer`; alguna variante pequeña por clase
   (`playerClass`).
4. Sustituir `WorldLoadingScene` en `overworld` (o crear la escena de zona y
   enrutar `SCENE_AFTER_CLASS_SELECT`).
5. Placeholders de personaje hasta tener las referencias de Manu.
6. Tests, QA en Chromium, `npm run check`, actualizar HANDOFF, ROADMAP y
   DECISION_LOG.
