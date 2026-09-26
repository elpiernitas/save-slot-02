# Roadmap

Fecha límite: el juego se envía el **lunes 28 de septiembre de 2026**.

| Fase    | Contenido                                  | Estado                 |
| ------- | ------------------------------------------ | ---------------------- |
| GAME-00 | Constitución técnica y estructura          | ✅ Hecho               |
| GAME-01 | Desktop-first + fullscreen + boot + title  | ✅ Hecho               |
| GAME-02 | Motor de diálogos retro                    | ✅ Hecho               |
| GAME-03 | World bible + selección de clase           | ✅ Hecho               |
| GAME-04 | Mundo explorable / vertical slice de Gijón | ✅ Cerrado (D-068)     |
| GAME-05 | Inventario y cartas                        | ✅ Aceptado            |
| GAME-06 | Puzzles / minijuegos                       | ✅ Aceptado            |
| GAME-07 | Boss + aparición PLAYER 2                  | 🟡 Hecho, falta ACCEPT |
| GAME-08 | Portales y selección de fecha              | 🟡 Hecho (autónomo)    |
| GAME-09 | Final + save slot                          | 🟡 Hecho (autónomo)    |
| GAME-10 | Desbloqueos posteriores                    | ✂️ Recortado           |
| GAME-11 | Easter eggs, sonido, animaciones y pulido  | 🟡 Hecho (autónomo)    |
| GAME-12 | QA en ordenador + producción Netlify       | Pendiente              |

## Detalle por fase

### GAME-00 — Constitución técnica y estructura ✅

Proyecto Vite/React/TS, tooling (ESLint, Prettier, Vitest), `netlify.toml`,
modelo `GameSave`, capa de guardado con migraciones, utilidades de tiempo
Europe/Madrid, time gates, condiciones, contratos de diálogo/audio/inventario/
quests/logros, registro de escenas, viewport 16:9 con safe areas, shell mínimo.

### GAME-01 — Desktop-first + fullscreen + boot + title screen ✅

(Redefinida por D-017: sustituye "orientación horizontal móvil".)

- Gate de pantalla: `INCOMPATIBLE DISPLAY` (móvil) y `WINDOW TOO SMALL`.
- Abstracción Fullscreen API; el primer gesto desbloquea audio + fullscreen.
- Secuencia: system check → boot → save detectado → title screen.
- Save v2 (flags de arranque) con migración.
- Capa de input de teclado reutilizable; menú del título con teclado y ratón.
- Fuente pixel OFL autoalojada, transición de escena reutilizable.

### GAME-02 — Motor de diálogos retro ✅

- Hardening: sin setState en render (transición y gate); fullscreen con
  reintento sin opciones; merge profundo de settings.
- Runtime puro de diálogo, markup seguro, typewriter con velocidades,
  pausas y blips por voz, elecciones con opciones bloqueadas/ocultas y
  Escape, efectos conectados al reducer, validador de scripts, retratos por
  expresión.
- SETTINGS: TEXT SPEED y MOTION. Demo `dialogueDemo` (en español) desde
  CONTINUE.

### GAME-03 — World bible + selección de clase ✅

- `docs/WORLD_BIBLE.md`: Gijón cotidiano gamificado, franjas del día, estilo
  visual, paleta, personajes, clases, tarot, música.
- Clases GUERRERO / TANQUE / CURADOR (`src/game/player/classes.ts`), acción
  `player/assignClass` permanente, condición `playerClass`.
- Escena `classSelect` (intro, tarjetas, confirmación diegética) →
  `overworld` provisional ("LOADING WORLD..."). Demo de GAME-02 fuera del
  flujo.

### GAME-04 — Mundo explorable / vertical slice de Gijón 🔁

Técnicamente aceptado. La primera versión fue rechazada por interpretar
La Muralla como fortificación. La reconstrucción WIP `bbd1a6b` corrigió la
semántica y la tubería raster, pero **sigue sin alcanzar la dirección visual
aprobada**. GAME-04R queda bloqueando GAME-05; criterios en
`docs/GAME_04R_VISUAL_REBUILD.md`.

- Motor propio Canvas 2D (D-048), mundo a 640×360 (D-049).
- Slice: la calle del **bar La Muralla** en Cimavilla por la tarde: fachada
  del bar, terraza con sombrillas y cortavientos, árboles, portal, persiana,
  frutería, bolardos; camarera genérica.
- 10 interactuables (descriptivos, absurdos, variante por clase en el
  bolardo), prompt contextual, pausa (Esc), checkpoints por zona, resume.
- PLAYER 1 provisional a 32×48; arte raster PNG generado por `npm run art`.

### GAME-05 — Inventario y CITY CARDS ✅

Aceptado por ChatGPT (D-069).

- Registros estáticos `src/game/content/items.ts` y `cards.ts`; categorías
  `quest/object/consumable/key`; cartas con número, tipo, rareza (solo
  visual) y arte = ventana sobre ENV-001.
- Reducer: `item/give`, `item/take`, `card/give`, `card/markSeen`; efectos de
  diálogo `giveItem`/`takeItem`/`giveCard` reales; ids desconocidos = error de
  validación. Sin cambio de `SAVE_VERSION`.
- Recompensas escasas en La Muralla: carta 001 (camarera) y 002 (bolardo).
- UI: aviso de recompensa, INVENTARIO y binder CITY CARDS desde la pausa;
  NEW hasta abrir la carta; teclado y ratón; mundo montado y en pausa.

### GAME-06 — Puzzles / minijuegos ✅

Aceptado (D-070). En La Muralla (no hay arte de
Cholo): tras la camarera, SIDE QUEST ROUTE UPDATED → ROUTE BEACONS (pizarra =
CUP, farola = LAMP, gaviota = BIRD) → carta 005 → SERVICE ACCESS (puerta del
12) → SYNC TERMINAL: PLAYER 1 SYNCED, PLAYER 2 NOT FOUND, fallback,
RECOVERY PROCESS ERROR. MG-01 SEAGULL PROTOCOL recortado (opcional).

### GAME-07 — Boss + aparición PLAYER 2 🟡

Implementado (D-071), pendiente de ACCEPT. DESYNC PROCESS: tres fases
(CHECKSUM MISMATCH, SIGNAL SPLIT, MISSING CHANNEL), SIGNAL 3/3, RETRY y assist
tras 2 fallos. Reveal sobrio: SIGNAL FOUND → PLAYER 2 — MANU → una línea →
PARTY STATUS — 2/2 → gate cooperativo → DESTINATION DATA AVAILABLE → GAME-08.

### GAME-08 — Portales y selección de fecha 🟡

Implementado (D-072): cuatro puertas (mié 30, jue 1, vie 2 bloqueado por el
teatro, dom 4), disponibilidad en Europe/Madrid, guardado solo al confirmar.

Solo `DATE_OPTIONS`; el viernes aparece como `MAIN QUEST ALREADY ACTIVE`.
Guardar `dateQuest.chosenOptionId`.

### GAME-09 — Final + save slot 🟡

Implementado (D-073): final corto con la fecha elegida y slot persistente
como destino de CONTINUE.

### GAME-10 — Desbloqueos posteriores

Usar `TimeGate` (`relativeToChosenDate`, `fromDate`, `hourWindow`…).

### GAME-11 — Easter eggs, sonido, animaciones y pulido

Sustituir `createSilentAudioEngine` por un motor real (Web Audio / HTMLAudio)
con el mismo contrato `AudioEngine`. Botón de mute visible.

### GAME-12 — QA en ordenador + producción Netlify

QA en ordenador real (Chrome, Safari, Firefox, Edge; fullscreen real,
portátil 1366×768 y monitores grandes), comprobación del bloqueo en móvil,
rendimiento, despliegue.
