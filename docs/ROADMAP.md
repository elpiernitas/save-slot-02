# Roadmap

Fecha límite: el juego se envía el **lunes 28 de septiembre de 2026**.

| Fase    | Contenido                                  | Estado      |
| ------- | ------------------------------------------ | ----------- |
| GAME-00 | Constitución técnica y estructura          | ✅ Hecho    |
| GAME-01 | Desktop-first + fullscreen + boot + title  | ✅ Hecho    |
| GAME-02 | Motor de diálogos retro                    | ✅ Hecho    |
| GAME-03 | World bible + selección de clase           | ✅ Hecho    |
| GAME-04 | Mundo explorable / vertical slice de Gijón | ⏭ Siguiente |
| GAME-05 | Inventario y cartas                        | Pendiente   |
| GAME-06 | Puzzles / minijuegos                       | Pendiente   |
| GAME-07 | Boss + aparición PLAYER 2                  | Pendiente   |
| GAME-08 | Portales y selección de fecha              | Pendiente   |
| GAME-09 | Final + save slot                          | Pendiente   |
| GAME-10 | Desbloqueos posteriores                    | Pendiente   |
| GAME-11 | Easter eggs, sonido, animaciones y pulido  | Pendiente   |
| GAME-12 | QA en ordenador + producción Netlify       | Pendiente   |

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

### GAME-04 — Mundo explorable / vertical slice de Gijón

Primera zona jugable siguiendo `WORLD_BIBLE.md`: decidir motor (canvas
propio vs Phaser), reevaluar la resolución 480×270 con sprites/fondos
reales, movimiento, colisiones, NPCs con `DialoguePlayer`, una franja
horaria y su paleta. Sustituye el `overworld` provisional.

### GAME-05 — Inventario y cartas

Contenido de items y cartas originales, UI de inventario y binder, acciones
de reducer (`item/give`, `card/give`…), primeros logros.

### GAME-06 — Puzzles / minijuegos

### GAME-07 — Boss + aparición PLAYER 2

### GAME-08 — Portales y selección de fecha

Solo `DATE_OPTIONS`; el viernes aparece como `MAIN QUEST ALREADY ACTIVE`.
Guardar `dateQuest.chosenOptionId`.

### GAME-09 — Final + save slot

### GAME-10 — Desbloqueos posteriores

Usar `TimeGate` (`relativeToChosenDate`, `fromDate`, `hourWindow`…).

### GAME-11 — Easter eggs, sonido, animaciones y pulido

Sustituir `createSilentAudioEngine` por un motor real (Web Audio / HTMLAudio)
con el mismo contrato `AudioEngine`. Botón de mute visible.

### GAME-12 — QA en ordenador + producción Netlify

QA en ordenador real (Chrome, Safari, Firefox, Edge; fullscreen real,
portátil 1366×768 y monitores grandes), comprobación del bloqueo en móvil,
rendimiento, despliegue.
