# HANDOFF

> Léeme primero. Resumen para que una sesión nueva continúe sin contexto previo.
> Después: `docs/GAME_CONSTITUTION.md` (reglas), `docs/WORLD_BIBLE.md`
> (universo), `docs/ART_DIRECTION_V1.md` (dirección),
> `docs/GAME_04R_VISUAL_REBUILD.md` (**gate visual actual**),
> `docs/STORY_BIBLE.md` (estructura narrativa), `docs/CONTENT_BACKLOG.md`
> (ideas futuras) y `docs/DECISION_LOG.md` (por qué).

**Fase actual:** GAME-04 — **reconstrucción visual** del slice tras la
revisión de Manu (2026-09-25). Técnicamente aceptado; pendiente de
**aprobación visual**.
**Próxima fase:** GAME-05 — inventario y cartas, **solo cuando Manu apruebe
visualmente GAME-04**.

> Recordatorios: desktop-first (D-017). UI/sistema en inglés retro, diálogo en
> español. Gijón cotidiano gamificado (D-040). **Exploración con motor propio
> Canvas 2D, no Phaser (D-048); mundo a 640×360 (D-049).** React es dueño del
> save, diálogos y UI. **La Muralla es el bar/café, no una muralla (D-054).**
> Runtime visual = PNG raster; `tools/art` es placeholder/regresión, no north
> star final (D-057). Personajes objetivo ≥32×48 (D-056).

## Estado del repositorio

- Rama `claude/save-slot-02-game-00-5tw0pw`, PR #1 (borrador) contra la rama
  por defecto `anthropich/claude-code-cloud`. Contiene GAME-00 → GAME-04 y el
  commit de referencias visuales de Manu (`c2dd94e`). No mergeado. Sin CI.
- El commit WIP `bbd1a6b` añadió una reconstrucción raster/generada. Sirve
  para validar la tubería de assets, pero **no está aprobado visualmente**.
- No continuar GAME-05 hasta superar `docs/GAME_04R_VISUAL_REBUILD.md`.
- `SAVE_VERSION` sigue en **2** (GAME-04 no cambió la forma JSON).
- El antiguo `docs/art/visual-concept-v1.jpg` corrupto (D-053) se eliminó.
  Las referencias activas están en `docs/art/chatgpt-v2/`.

## Qué hay hecho

### GAME-00 → GAME-03 (resumen)

Base Vite + React + TS; save versionado; tiempo Europe/Madrid; gate de
pantalla; fullscreen; arranque systemCheck → boot → saveDetected → title;
input por capas; motor de diálogo completo; SETTINGS; world bible; clases
GUERRERO / TANQUE / CURADOR con `player/assignClass` y condición
`playerClass`; escena `classSelect`.

### GAME-04

- **Motor** (`src/game/world/`): `types`, `collision`, `movement` (4
  direcciones, 80 px/s, sin inercia), `camera`, `interaction` (frontal) y
  zonas, `checkpoint`, `engine/WorldEngine` (bucle, pausa + cooldown,
  eventos, `destroy`), `render/canvasRenderer`, `art/` (personajes y props
  como datos pixel), `config` (resolución), `scripts` (puente a diálogos).
- **Mapa** `maps/muralla.ts` + `maps/muralla.layout.json` (fuente única de
  geometría para mapa y arte): la calle del **bar La Muralla** en Cimavilla
  por la tarde, 50×26 tiles (800×416 px). Fachadas (mercería con persiana,
  bar con rótulo y escaparates, portal nº 7, frutería), acera, adoquín de
  granito, terraza con 4 mesas (2 sombrillas abiertas, 2 plegadas) y
  cortavientos de cristal con entrada, dos árboles grandes, banco, papelera,
  pizarra, macetas, bolardos junto al bordillo, gaviota, camarera genérica.
- **Arte** (`src/assets/world/muralla/*.png` + `manifest.json`), generado
  por `tools/art/` (`npm run art`), comprobado por `npm run art:check`.
  Renderer (`render/canvasRenderer.ts`) solo blitea y ordena por y.
- **Interactuables (10)**: árbol, escaparates del bar (×2), puerta del bar,
  portal ("La puerta no abre. Todavía."), persiana ("VUELVO EN 5 MIN"),
  pizarra, mesa libre (recuerda si ya la miraste), bolardo marcado
  (**variante por clase**), camarera (elección registrada y memoria).
- **Escena** `overworld` = `OverworldScene` (adaptador React): canvas, HUD
  "LA MURALLA · TARDE", pistas, prompt `E / ENTER — INTERACT` solo cuando hay
  algo delante, `DialoguePlayer`, menú de pausa (CONTINUAR / VOLVER AL
  TÍTULO), texto de llegada la primera vez.
- **Input**: teclas mantenidas en el `InputRouter`, capa `world` por debajo
  de todo, `E` = confirmar.
- **Save**: checkpoint `"muralla:<spawn>"` por zona (acción
  `progress/checkpoint`); ahora sobrevive a título y refresh.

## Trabajo de planificación preparado durante el bloqueo de Claude

- `docs/STORY_BIBLE.md`: estructura ACT 0–VI, reveal de PLAYER 2, date gate y
  reglas para usar referencias personales sin convertirlo en un álbum.
- `docs/CONTENT_BACKLOG.md`: candidatos para inventario/cartas, puzzles,
  boss, portales, post-game, OST y backlog de assets. **Planning only**;
  no desbloquea GAME-05.
- GAME-05 queda completamente preparado en documentación: `GAME_05_SPEC.md`,
  `CITY_CARDS_BIBLE.md`, `GAME_05_UI_SPEC.md`, `GAME_05_TEST_MATRIX.md` y
  `GAME_05_IMPLEMENTATION_ORDER.md`. También existe la skill
  `.claude/skills/save-slot-inventory-cards/SKILL.md`. **No implementar hasta
  ACCEPT visual de GAME-04R.**
- GAME-06 también está preparado a nivel de diseño/arquitectura:
  `GAME_06_SPEC.md`, `PUZZLE_BIBLE.md`, `GAME_06_CONTENT_FLOW.md`,
  `GAME_06_IMPLEMENTATION_ORDER.md`, `GAME_06_TEST_MATRIX.md` y la skill
  `.claude/skills/save-slot-puzzles/SKILL.md`. Incluye ROUTE BEACONS,
  SEAGULL PROTOCOL opcional y SYNC TERMINAL que prepara el misterio de
  PLAYER 2. **No implementar hasta aceptar GAME-05.**
- GAME-07 queda especialmente cerrado para producción: además del spec base,
  incluye `GAME_07_BOSS_PATTERN_SPEC.md` (secuencia/timing determinista),
  `GAME_07_REVEAL_UI_SPEC.md` (staging de PLAYER 2),
  `GAME_07_ASSET_REQUESTS.md`, `GAME_07_SCOPE_CUT.md`,
  `GAME_07_TECHNICAL_CONTRACT.md` y `GAME_07_COPY.md`. La línea humana
  de reveal queda fijada a "¿me ha cargado bien por lo menos?". GAME-07→12
  tienen paquetes de spec/orden/tests/skills preparados. Índice completo:
  `docs/PROJECT_INDEX.md`. El critical path real está en
  `docs/RELEASE_CRITICAL_PATH.md`; GAME-10 es cortable y GAME-12 ya tiene
  checklist/QA/Netlify. CI del PR ejecuta `npm run check` (D-059).

## Qué NO está hecho (a propósito)

- Resto de Gijón, otras franjas horarias, transiciones entre mapas.
- Sprites/retratos finales de Luis, Manu y Randy todavía no están integrados;
  las referencias ya existen en `docs/art/chatgpt-v2/`. Randy, Manu, tarot,
  Hoyo 13 y equivalentes comerciales siguen fuera del slice GAME-04R.
- Inventario, cartas (→ GAME-05), puzzles, boss, Player 2, cita.
- Música (GAME-11). Zoom de cámara (solo si la QA real lo pide).

## QA realizada / pendiente

- Chromium headless:
  - Recorrido físico completo del slice en dev (con un handle de depuración
    solo en dev) a 1920×1080: los 7 interactuables con prompt y diálogo,
    colisiones (bordillo), pausa que bloquea el movimiento, título conserva
    el checkpoint, refresh reanuda en la zona (terraza), variante del
    bolardo con las 3 clases.
  - Build de producción, flujo completo desde cero (boot → clase → mundo) a
    1920×1080 (fullscreen emulado), 1440×900 y 1366×768: sin scroll, 16:9,
    consola limpia, sin handle de depuración.
  - Comparación de resolución 480×270 vs 640×360 (D-049).
- Pendiente en máquina real: sensación de movimiento a 60/120/144 Hz,
  nitidez en pantallas no 1080p, fullscreen real, audio, Safari/Firefox.
  Revisar el slice contra las referencias activas de `docs/art/chatgpt-v2/`.
- Revisión visual (reconstrucción): capturas en `docs/art/review/` a
  1920×1080, 1440×900 y 1366×768 (build de producción).

## Archivos importantes

| Archivo                                        | Para qué                                |
| ---------------------------------------------- | --------------------------------------- |
| `src/game/world/types.ts`                      | modelo `WorldMap`                       |
| `src/game/world/maps/muralla.ts`               | datos del slice                         |
| `src/game/world/engine/WorldEngine.ts`         | motor (estado efímero)                  |
| `src/game/world/maps/muralla.layout.json`      | geometría compartida mapa ↔ arte        |
| `src/game/world/render/canvasRenderer.ts`      | render (blit de PNG, orden por y)       |
| `src/game/world/art/assets.ts`                 | URLs, manifest y carga de sprites       |
| `tools/art/*.mjs`                              | generador del arte (PNG)                |
| `src/game/scenes/overworld/OverworldScene.tsx` | puente React ↔ motor                    |
| `src/game/content/dialogue/muralla.ts`         | diálogos del slice                      |
| `src/game/world/world.test.ts`                 | tests de lógica y del mapa              |
| `src/game/input/inputRouter.ts`                | capas, teclas mantenidas, `world`       |
| `src/game/dialogue/effects.ts`                 | `giveItem`/`giveCard` aún `unsupported` |
| `src/game/inventory/types.ts`                  | contrato de inventario/cartas (GAME-05) |

## GAME-04R · iteración 1 (D-060)

- Referencias `docs/art/chatgpt-v2/*.jpg` corruptas: pendiente volver a
  subirlas (o subir directamente los PNG de runtime).
- Hecho: cámara suave con zona muerta, UI navy/crema, prompt sobre PLAYER 1,
  diálogo arriba cuando el jugador está abajo, sin tinte global, manifest con
  `status`. Capturas en `docs/art/review/game-04r-iter1/`.
- Todo el arte del mundo sigue siendo **placeholder**.

## GAME-04R · iteración 2 (D-061)

- Rebuild visual del slice: personajes 40×60, bar como protagonista, terraza
  con clientes, peatones, capa de primer plano, luz de tarde. Mapa 960×400.
- Capturas: `docs/art/review/game-04r-iter2/`. Arte = placeholder.
- Referencias `chatgpt-v2/*.jpg` aún corruptas.

## Reparto de trabajo (instrucción de Manu, vigente)

- **ChatGPT**: dirección creativa y visual; produce el arte final.
- **Claude**: implementación, integración, código, colisiones, cámara,
  manifests, tests y QA. **No genera arte** (ni procedural ni
  "aproximaciones"); si falta un asset, lo pide en el PR con contrato exacto
  (id, ruta, tamaño, transparencia, grid/frames, ancla, huella de colisión,
  uso en runtime, restricciones).
- Dudas de diseño/UX/narrativa → a ChatGPT en el PR. Decisiones técnicas →
  Claude las resuelve y sigue. Sin GAME-05 hasta ACCEPT final de GAME-04R.
  Sin merge.
- Flujo al recibir un asset: sustituir PNG → ajustar ancla/colisiones →
  `status: "final"` en el manifest → `npm run art:check` → `npm run check` →
  capturas → PR para ACCEPT / FIXES / NEXT.
- `npm run art` **nunca toca** sprites con `status: "final"`.
- Importar arte aprobado: `npm run art:import -- <spriteId> <archivo.png>
  [--anchor X,Y]` valida el contrato (tamaño exacto, fondo transparente u
  opaco, ningún frame vacío), normaliza a RGBA, sustituye el placeholder y lo
  marca `final`. `art:check` decodifica cualquier PNG estándar (autotest de
  tipos de color, profundidades, filtros y Adam7).

## Estado GAME-04R — CERRADO (D-068)

**ACCEPT** de ChatGPT (PR, comentario 5847231933) como base visual jugable.
Composición canónica congelada en `17d6b53`; textos alineados en `df8868d`.

- Fondo: ENV-001 de ChatGPT píxel a píxel; colisiones medidas sobre él.
- Oclusores recortados de ENV-001 (`tools/art/occluders.mjs`): farola,
  pizarra, bolardos, papelera, gaviotas.
- PLAYER 1: `playerLarge` = CHAR-001 ×2 (`tools/art/scale-player.mjs`).
- Deudas de pulido para GAME-11 (`docs/GAME_11_POLISH_CHECKLIST.md`): Luis
  nativo 80×120 y limpieza de ENV-001 (franja central, rótulo), si llegan.

## GAME-05 — hecho, pendiente de ACCEPT (D-069)

Inventario + CITY CARDS según `docs/GAME_05_SPEC.md`: registros, reducer,
efectos de diálogo, cartas 001/002 en La Muralla, aviso de recompensa,
INVENTARIO y binder desde la pausa. QA en 1920×1080, 1440×900 y 1366×768
(`docs/art/review/game-05/`).

## Próximo paso exacto

1. Esperar ACCEPT / FIXES de ChatGPT sobre GAME-05.
2. Después: **GAME-06 — puzzles / minijuegos** (no empezar dentro de GAME-05).

