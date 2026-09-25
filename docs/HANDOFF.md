# HANDOFF

> Léeme primero. Resumen para que una sesión nueva continúe sin contexto previo.
> Después: `docs/GAME_CONSTITUTION.md` (reglas) y `docs/DECISION_LOG.md` (por qué).

**Última fase cerrada:** GAME-00 — constitución técnica y estructura (2026-09-25)
**Próxima fase:** **GAME-01 — orientación horizontal + boot + title screen**

## Qué se ha hecho (GAME-00)

- Proyecto Vite 8 + React 19 + TypeScript 6 (estricto, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`), ESLint 10 (flat config) + Prettier + Vitest 5.
- Scripts npm: `dev build preview lint test typecheck format check`.
- `netlify.toml` (build, SPA fallback, cabeceras noindex/caché), `robots.txt`.
- `index.html` móvil: `viewport-fit=cover`, noindex, título neutro.
- **Estado:** `GameSave` completo (`src/game/state/types.ts`), `gameReducer`
  con acciones genéricas, `GameProvider` + `useGame` con autosave.
- **Guardado:** `StorageDriver` async, driver localStorage (fallback a memoria),
  `SaveManager` (`createNewGame`, `loadGame`, `saveGame`, `resetGame`,
  `loadOrCreateGame`), migraciones encadenadas, backup de saves corruptos.
- **Tiempo:** `src/lib/time` (Clock, conversión Europe/Madrid, DST) y
  `src/game/calendar` (fechas del proyecto, `DATE_OPTIONS`, viernes bloqueado,
  `TimeGate` + `isTimeGateOpen`).
- **Condiciones** declarativas (`evaluateCondition`).
- **Contratos (solo tipos):** diálogo, inventario/cartas, quests, logros, audio.
- **Audio:** `AudioEngine` + `createSilentAudioEngine` + `useAudioUnlock`.
- **Escenas:** `SCENE_IDS`, `SCENE_REGISTRY`, `SceneRenderer`,
  `PlaceholderScene`, `BootScene` (shell "SAVE SLOT 02 / SYSTEM INITIALIZED /
  GAME-00" con diagnóstico de save y orientación).
- **Viewport:** `GameViewport` = escenario 16:9 dentro de safe areas, `100dvh`,
  sin scroll, container queries (`cqh`).
- **Estilos:** `tokens.css` (paleta provisional) + `global.css` (reset móvil).
- **Tests:** 66 tests en 8 archivos (tiempo, calendario, save, migraciones,
  reducer, condiciones, audio, registro de escenas).
- Documentación: README, constitución, roadmap, decision log, este handoff.

## Qué NO se ha hecho (a propósito)

- Pantalla `ROTATE DEVICE TO CONTINUE` (solo existe `useOrientation` y
  `data-orientation` en el viewport) → GAME-01.
- Title screen real, secuencia de boot real → GAME-01.
- Fuente bitmap y paleta definitiva → GAME-01 (D-011).
- Motor de diálogo (solo tipos) → GAME-02.
- Clases, mapa, items/cartas concretos, puzzles, boss, selección de fecha,
  final, desbloqueos → GAME-03…GAME-10.
- Audio real, assets, botón de mute visible → GAME-11 (el ajuste `muted`
  ya existe en el save).
- Supabase, backend, analítica, Phaser, router: no instalados.
- Despliegue en Netlify: no realizado.
- Tests de componentes React (no hay jsdom/Testing Library; se añadirán cuando
  haya UI con lógica que lo justifique).

## Estado técnico

- `npm run check` pasa: typecheck, lint, format:check, 66 tests, build.
- Build: ~228 kB JS (~71 kB gzip), casi todo React.
- Verificado en Chromium headless con viewport de iPhone (844×390 y 390×844):
  el shell se pinta, el escenario 16:9 se ajusta, sin scroll, el save se crea
  (`NEW`) y se recarga (`LOADED`), sin errores de consola.
- **No verificado aún en un iPhone real** (safe areas reales, Safari iOS,
  barra dinámica). Pendiente para GAME-01/GAME-12.
- Clave de guardado: `saveSlot02:save` (backup: `saveSlot02:save:corrupt-backup`).
- `SAVE_VERSION = 1`, sin migraciones todavía.

## Archivos importantes

| Archivo                                  | Para qué                                  |
| ---------------------------------------- | ----------------------------------------- |
| `src/app/App.tsx`, `src/app/services.ts` | composición y cableado de servicios       |
| `src/game/state/types.ts`                | modelo `GameSave` + `SAVE_VERSION`        |
| `src/game/state/gameReducer.ts`          | única vía de mutación del save            |
| `src/game/state/GameProvider.tsx`        | carga, autosave, `dispatch` con timestamp |
| `src/game/save/saveManager.ts`           | API de persistencia                       |
| `src/game/save/migrations.ts`            | versionado del save                       |
| `src/game/calendar/calendar.ts`          | fechas del proyecto y time gates          |
| `src/lib/time/zonedTime.ts`              | conversión de zona horaria                |
| `src/game/scenes/registry.ts`            | registrar escenas nuevas                  |
| `src/game/scenes/boot/BootScene.tsx`     | shell GAME-00 (a sustituir en GAME-01)    |
| `src/game/dialogue/types.ts`             | contrato del motor de diálogo             |
| `src/components/GameViewport/*`          | escenario 16:9 + safe areas               |
| `src/styles/tokens.css`                  | tokens visuales                           |
| `netlify.toml`                           | build y cabeceras de Netlify              |

## Próximo paso exacto

**GAME-01 — orientación horizontal + boot + title screen**

1. Crear `src/components/RotateDevice/` con la pantalla
   `ROTATE DEVICE TO CONTINUE` y la animación del teléfono girando
   (CSS, respetando `prefers-reduced-motion`); mostrarla desde `GameViewport`
   cuando `useOrientation() === 'portrait'`, sin desmontar el juego (no perder
   estado).
2. Sustituir el shell de `BootScene` por una secuencia de boot corta que
   termine en `dispatch({ type: 'scene/goTo', scene: 'title' })`.
3. Crear `src/game/scenes/title/` y registrarla en `SCENE_REGISTRY`; la
   primera pulsación desbloquea audio (ya cableado con `useAudioUnlock`).
4. Elegir fuente bitmap OFL, autoalojarla, documentar licencia (D-011) y
   ajustar paleta en `tokens.css`.
5. Añadir transición rápida entre escenas en `SceneRenderer`.
6. `npm run check`, actualizar este HANDOFF, ROADMAP y DECISION_LOG.
