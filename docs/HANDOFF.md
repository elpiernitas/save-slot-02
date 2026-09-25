# HANDOFF

> Léeme primero. Resumen para que una sesión nueva continúe sin contexto previo.
> Después: `docs/GAME_CONSTITUTION.md` (reglas) y `docs/DECISION_LOG.md` (por qué).

**Última fase cerrada:** GAME-01 — desktop-first + fullscreen + boot + title (2026-09-25)
**Próxima fase:** **GAME-02 — motor de diálogos retro**

> Pivote D-017: el juego es **desktop-first** (teclado, 16:9, fullscreen
> recomendado). El móvil se bloquea con `INCOMPATIBLE DISPLAY`. No hay pantalla
> `ROTATE DEVICE`; no volver a planes mobile-first.

## Estado del repositorio

- Rama `claude/save-slot-02-game-00-5tw0pw`, PR #1 (borrador) contra la rama
  por defecto `anthropich/claude-code-cloud`. Contiene GAME-00 + GAME-01. No
  mergeado. Sin CI configurado en el repo.
- `npm run check` pasa: typecheck, lint, format:check, 116 tests (13 archivos),
  build (~246 kB JS / 77 kB gzip; fuente 2 × 7,8 kB).

## Qué hay hecho

### GAME-00 (base)

Vite + React 19 + TS 6 estricto, ESLint, Prettier, Vitest; `netlify.toml`;
`GameSave` + reducer + `GameProvider` con autosave; capa de guardado
desacoplada con migraciones; tiempo Europe/Madrid, calendario del proyecto,
time gates; condiciones declarativas; contratos de diálogo/inventario/quests/
logros/audio; registro de escenas; escenario 16:9.

### GAME-01

- **Docs:** pivote desktop-first en constitución, decision log (D-017…D-026),
  README, roadmap, `docs/ASSETS.md`.
- **Gate de pantalla** (`src/lib/display`, `src/components/DisplayGate`):
  móvil → `INCOMPATIBLE DISPLAY` (el juego no se monta, no se crea save);
  ventana < 800×450 → `WINDOW TOO SMALL`, continúa solo al agrandar.
- **Fullscreen** (`src/lib/fullscreen`, `useFullscreen`): API segura, nunca
  lanza; `entered | already | unsupported | denied`.
- **Input** (`src/game/input`): un listener global, keymap flechas/WASD/
  Enter/Espacio/Escape, `InputRouter` por capas, `useInput`, `InputBlocker`,
  navegación de menú pura.
- **UI** (`src/game/ui`): `Menu` + `useMenu` (teclado + ratón + blips),
  `LeaderLine`, `PixelSprite`, `useRevealLines`, `useReducedMotion`, `ui.css`
  (caja RPG, indicador ▼ en CSS, pistas de teclas).
- **Escenas:** `systemCheck` → `boot` → `saveDetected` → `title` (+ panel
  SETTINGS: fullscreen, sonido). `PlaceholderScene` diegética para escenas
  sin construir (Esc/Enter → título).
- **Transición** de escena reutilizable en `SceneRenderer` (corte a negro
  escalonado, bloquea input, instantánea con movimiento reducido).
- **Save v2:** `system` (boot/sesiones) + `progress.resumeSceneId`,
  migración 1→2 con test sobre un save v1 real. Cada carga = nueva sesión que
  empieza en `systemCheck`.
- **Audio:** `createWebAudioEngine` con SFX sintetizados (sin archivos).
- **Fuente:** Pixelify Sans (OFL), autoalojada.

## Qué NO está hecho (a propósito)

- Motor de diálogo (solo tipos) → **GAME-02**.
- Ajustes de velocidad de texto y movimiento reducido en SETTINGS (existen en
  el save) → GAME-02.
- Clases, mapa, inventario/cartas reales, puzzles, boss, Player 2, fecha,
  final, desbloqueos → GAME-03…GAME-10.
- Música → GAME-11. Ocultar cursor por inactividad: solo preparado
  (`[data-cursor='hidden']` en `global.css`).
- Supabase, backend, Phaser, router, analítica: no instalados. Sin despliegue.

## QA realizada / pendiente

- Chromium headless (Playwright): 1920×1080, 1440×900, 1366×768, 1366×657,
  ventana 700×420 → 1280×720, encogido en mitad de la partida, iPhone 13
  vertical/horizontal, Pixel horizontal, `prefers-reduced-motion`. Sin
  scroll, 16:9 correcto con letterbox, teclado y ratón en el título, refresh
  salta la intro, consola sin errores.
- **Fullscreen real no verificado:** en headless la petición se resuelve y
  `document.fullscreenElement` se rellena, pero no hay pantalla física. Probar
  en Chrome/Safari/Firefox reales (GAME-12). Tampoco verificado: si Escape, al
  salir del fullscreen, llega o no como `keydown` a la página en cada
  navegador (el juego lo tolera en ambos casos).
- Sonido real no escuchado (headless).

## Archivos importantes

| Archivo                                                  | Para qué                              |
| -------------------------------------------------------- | ------------------------------------- |
| `src/app/App.tsx`, `src/app/services.ts`                 | composición y servicios               |
| `src/components/DisplayGate/*`                           | bloqueo móvil / ventana pequeña       |
| `src/lib/fullscreen/fullscreen.ts`                       | Fullscreen API                        |
| `src/lib/display/displayGate.ts`                         | umbrales del gate                     |
| `src/game/input/*`                                       | teclado y menús                       |
| `src/game/ui/*`                                          | componentes RPG reutilizables         |
| `src/game/scenes/registry.ts`, `flow.ts`                 | registrar escenas, rutas de arranque  |
| `src/game/scenes/SceneRenderer.tsx`                      | escena activa + transición            |
| `src/game/scenes/{systemCheck,boot,saveDetected,title}/` | escenas de GAME-01                    |
| `src/game/state/types.ts`, `gameReducer.ts`              | modelo `GameSave` v2 y mutaciones     |
| `src/game/save/migrations.ts`                            | migraciones del save                  |
| `src/game/dialogue/types.ts`                             | **contrato a implementar en GAME-02** |
| `src/game/audio/*`                                       | motor de audio y SFX                  |
| `src/styles/tokens.css`                                  | paleta, `--px`, escala tipográfica    |

## Próximo paso exacto

**GAME-02 — motor de diálogos retro**

1. Implementar un reproductor puro de `DialogueScript` (estado
   `DialogueRuntimeState`, avance de nodos, condiciones con
   `evaluateCondition`, efectos → acciones del reducer) con tests.
2. Componente de caja de diálogo (reutilizar `.rpg-box`, `.more-indicator`,
   `Menu`/`useMenu` para elecciones, `useInput` para avanzar/saltar).
3. Typewriter con `settings.textSpeed` y blips `audio.playVoiceBlip`,
   instantáneo con movimiento reducido.
4. Añadir TEXT SPEED y MOTION al panel SETTINGS.
5. Una escena/demo mínima para probarlo sin escribir aún la historia.
6. `npm run check`, actualizar HANDOFF, ROADMAP y DECISION_LOG.
