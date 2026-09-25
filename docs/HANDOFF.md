# HANDOFF

> Léeme primero. Resumen para que una sesión nueva continúe sin contexto previo.
> Después: `docs/GAME_CONSTITUTION.md` (reglas), `docs/WORLD_BIBLE.md`
> (universo), `docs/ART_DIRECTION_V1.md` (concepto visual aprobado) y
> `docs/DECISION_LOG.md` (por qué).

**Última fase cerrada:** GAME-04 — mundo explorable / vertical slice de Gijón (2026-09-25)
**Próxima fase:** **GAME-05 — inventario y cartas**

> Recordatorios: desktop-first (D-017). UI/sistema en inglés retro, diálogo en
> español. Gijón cotidiano gamificado (D-040). **Exploración con motor propio
> Canvas 2D, no Phaser (D-048); mundo a 640×360 (D-049).** React es dueño del
> save, diálogos y UI.

## Estado del repositorio

- Rama `claude/save-slot-02-game-00-5tw0pw`, PR #1 (borrador) contra la rama
  por defecto `anthropich/claude-code-cloud`. Contiene GAME-00 → GAME-04 y el
  commit de referencias visuales de Manu (`c2dd94e`). No mergeado. Sin CI.
- `npm run check` pasa: typecheck, lint, format:check, 272 tests (29
  archivos), build (~305 kB JS / 99 kB gzip).
- `SAVE_VERSION` sigue en **2** (GAME-04 no cambió la forma JSON).
- ⚠️ `docs/art/visual-concept-v1.jpg` está **truncado** (no decodifica).
  Hay que volver a subirlo (D-053).

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
- **Mapa** `maps/muralla.ts`: La Muralla / borde de Cimavilla por la tarde
  (48×30 tiles de 16 px): muralla con puerta cerrada, franja verde y
  jardineras, árbol grande con banco, cartel, farola, café con toldo y
  terraza (5 mesas con sombrilla), camarera genérica, bolardos, bordillo,
  calle con paso de cebra (no transitable), gaviotas, guirnalda de luces.
- **Interactuables (7)**: muralla y árbol (descriptivos), cartel de gaviotas
  y mesa libre (absurdos; la mesa recuerda si ya la miraste), puerta ("No
  abre. Todavía."), bolardo marcado (**variante por clase**), camarera (NPC
  con elección registrada y memoria).
- **Escena** `overworld` = `OverworldScene` (adaptador React): canvas, HUD
  "LA MURALLA · TARDE", pistas, prompt `E / ENTER — INTERACT` solo cuando hay
  algo delante, `DialoguePlayer`, menú de pausa (CONTINUAR / VOLVER AL
  TÍTULO), texto de llegada la primera vez.
- **Input**: teclas mantenidas en el `InputRouter`, capa `world` por debajo
  de todo, `E` = confirmar.
- **Save**: checkpoint `"muralla:<spawn>"` por zona (acción
  `progress/checkpoint`); ahora sobrevive a título y refresh.

## Qué NO está hecho (a propósito)

- Resto de Gijón, otras franjas horarias, transiciones entre mapas.
- Sprites/retratos finales de Luis, Manu y Randy (esperan las referencias de
  Manu). Randy, Manu, tarot, Hoyo 13, Makro/IKEA: fuera del slice.
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
  Revisar el slice contra la imagen de concepto cuando se vuelva a subir.

## Archivos importantes

| Archivo                                        | Para qué                                |
| ---------------------------------------------- | --------------------------------------- |
| `src/game/world/types.ts`                      | modelo `WorldMap`                       |
| `src/game/world/maps/muralla.ts`               | datos del slice                         |
| `src/game/world/engine/WorldEngine.ts`         | motor (estado efímero)                  |
| `src/game/world/render/canvasRenderer.ts`      | render y pintado procedural             |
| `src/game/world/art/*`                         | personajes y props                      |
| `src/game/scenes/overworld/OverworldScene.tsx` | puente React ↔ motor                    |
| `src/game/content/dialogue/muralla.ts`         | diálogos del slice                      |
| `src/game/world/world.test.ts`                 | tests de lógica y del mapa              |
| `src/game/input/inputRouter.ts`                | capas, teclas mantenidas, `world`       |
| `src/game/dialogue/effects.ts`                 | `giveItem`/`giveCard` aún `unsupported` |
| `src/game/inventory/types.ts`                  | contrato de inventario/cartas (GAME-05) |

## Próximo paso exacto

**GAME-05 — inventario y cartas**

1. Diseñar items y cartas **originales** (inspiración: colección de cartas de
   Luis, sin IP de terceros) según WORLD_BIBLE.
2. Acciones de reducer (`item/give`, `item/take`, `card/give`) y soporte real
   de los efectos de diálogo `giveItem`/`takeItem`/`giveCard` (hoy
   `unsupported`); condiciones `hasItem` ya existen.
3. UI de inventario y binder de cartas (teclado + ratón), accesible desde el
   menú de pausa del mundo.
4. Engancharlo a 1–2 interactuables del slice sin inflar la historia.
5. Tests, QA en Chromium, `npm run check`, actualizar HANDOFF, ROADMAP,
   DECISION_LOG, ASSETS.
