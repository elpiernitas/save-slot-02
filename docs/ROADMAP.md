# Roadmap

Fecha límite: el juego se envía el **lunes 28 de septiembre de 2026**.

| Fase    | Contenido                                    | Estado      |
| ------- | -------------------------------------------- | ----------- |
| GAME-00 | Constitución técnica y estructura            | ✅ Hecho    |
| GAME-01 | Orientación horizontal + boot + title screen | ⏭ Siguiente |
| GAME-02 | Motor de diálogos retro                      | Pendiente   |
| GAME-03 | Selección de clase                           | Pendiente   |
| GAME-04 | Mapa y exploración                           | Pendiente   |
| GAME-05 | Inventario y cartas                          | Pendiente   |
| GAME-06 | Puzzles / minijuegos                         | Pendiente   |
| GAME-07 | Boss + aparición PLAYER 2                    | Pendiente   |
| GAME-08 | Portales y selección de fecha                | Pendiente   |
| GAME-09 | Final + save slot                            | Pendiente   |
| GAME-10 | Desbloqueos posteriores                      | Pendiente   |
| GAME-11 | Easter eggs, sonido, animaciones y pulido    | Pendiente   |
| GAME-12 | QA móvil + producción Netlify                | Pendiente   |

## Detalle por fase

### GAME-00 — Constitución técnica y estructura ✅

Proyecto Vite/React/TS, tooling (ESLint, Prettier, Vitest), `netlify.toml`,
modelo `GameSave`, capa de guardado con migraciones, utilidades de tiempo
Europe/Madrid, time gates, condiciones, contratos de diálogo/audio/inventario/
quests/logros, registro de escenas, viewport 16:9 con safe areas, shell mínimo.

### GAME-01 — Orientación horizontal + boot + title screen

- Pantalla `ROTATE DEVICE TO CONTINUE` con animación de teléfono girando
  (usar `useOrientation`, respetar reduced motion).
- Secuencia de boot real (sustituye `BootScene` del GAME-00).
- Title screen (escena `title`), primera interacción → desbloqueo de audio.
- Decidir fuente bitmap (D-011) y primera versión de paleta.
- Transición entre escenas en `SceneRenderer`.

### GAME-02 — Motor de diálogos retro

Implementar el contrato de `src/game/dialogue/types.ts`: caja RPG,
typewriter, páginas, ▼, nombre/retrato, elecciones, efectos, condiciones,
blips opcionales, velocidad de texto desde ajustes.

### GAME-03 — Selección de clase

Clases (idea: guerrero / tanque / curador u otras), estrechar
`PlayerClassId`, nombre del jugador.

### GAME-04 — Mapa y exploración

Movimiento, controles táctiles, mapa. **Evaluar aquí si hace falta Phaser**
(o canvas propio) y registrar la decisión.

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

### GAME-12 — QA móvil + producción Netlify

QA en iPhone real (Safari + Chrome), safe areas reales, modo "Añadir a
pantalla de inicio" (evaluar meta tags), rendimiento, despliegue.
