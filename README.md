# SAVE SLOT 02

Videojuego web privado, corto y jugable: un pequeño RPG de estilo portátil
retro pensado para jugarse **en ordenador** (teclado, pantalla 16:9,
preferiblemente en pantalla completa). El móvil queda bloqueado con una
pantalla diegética. Proyecto personal, repositorio privado.

> Visión, tono, fechas y reglas: [`docs/GAME_CONSTITUTION.md`](docs/GAME_CONSTITUTION.md).
> Universo (Gijón, estilo, personajes, clases): [`docs/WORLD_BIBLE.md`](docs/WORLD_BIBLE.md).
> Estado actual y siguiente paso: [`docs/HANDOFF.md`](docs/HANDOFF.md).
> Índice de fuentes y fases: [`docs/PROJECT_INDEX.md`](docs/PROJECT_INDEX.md).

## Requisitos

- Node.js ≥ 22 (`.nvmrc`)
- npm

## Uso

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo (http://localhost:5173)
npm test             # tests (Vitest)
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run format       # Prettier (escribe)
npm run build        # build de producción → dist/
npm run preview      # servir dist/ localmente
npm run art          # regenerar los placeholders procedurales actuales
npm run art:check    # validar PNG runtime + manifest (permite arte externo aprobado)
npm run art:check-generated # compara contra el generador procedural (solo placeholders)
npm run check        # typecheck + lint + format:check + art:check + tests + build
```

`npm run check` debe pasar antes de cerrar cualquier fase.

Para volver a ver la intro completa en local, borra el save desde la consola
del navegador: `localStorage.removeItem('saveSlot02:save')` y recarga.

## Arquitectura

```
src/
  main.tsx                 entrada: monta <App/> y los estilos globales
  app/                     composición: App.tsx y services.ts (cableado de producción)
  components/              UI fuera del escenario: DisplayGate, GameViewport (16:9)
  hooks/                   hooks genéricos (media query, fullscreen, display, audio unlock)
  lib/
    time/                  Clock, conversión Europe/Madrid, DateKey
    fullscreen/            abstracción de la Fullscreen API
    display/               lógica pura del gate de pantalla (móvil / ventana pequeña)
  styles/                  fonts.css, tokens.css (tokens + --px), global.css
  types/                   tipos compartidos primitivos
  assets/fonts/            Pixelify Sans (OFL) autoalojada
  assets/world/            PNG runtime del mundo + manifest.json (externos o generados)
  game/
    state/                 GameSave (v2), reducer, condiciones, GameProvider, useGame
    save/                  StorageDriver, localStorage, SaveManager, migraciones
    scenes/                ids, registro, flujo de arranque, SceneRenderer (+ transición),
                           systemCheck/, boot/, saveDetected/, title/
    input/                 keymap, InputRouter por capas, InputProvider, useInput, menú
    ui/                    Menu, useMenu, LeaderLine, PixelSprite, ui.css
    dialogue/              motor de diálogo: tipos, markup, typewriter, runtime puro,
                           efectos, validación, retratos; ui/ = capa React
    audio/                 contrato AudioEngine, motor Web Audio (SFX + voces sintetizadas)
    player/                clases de jugador (GUERRERO / TANQUE / CURADOR)
    world/                 exploración (GAME-04): tipos, mapas, colisión, movimiento,
                           cámara, interacción/zonas, checkpoints, WorldEngine,
                           renderer Canvas 2D (blitea PNG), carga de sprites
    content/               datos: jugador, reparto (cast), retratos, sigilos, scripts de diálogo
    calendar/              fechas del proyecto (Europe/Madrid) + time gates
    inventory/, quests/, achievements/   contratos (tipos) de fases futuras
tools/art/                 generador placeholder + validador de PNG runtime
docs/                      constitución, world bible, roadmap, decisiones, handoff, assets
```

Flujo: `App` crea los servicios (`Clock`, `SaveManager`, `AudioEngine`,
`FullscreenController`) → `InputProvider` (único listener de teclado) →
`DisplayGate` (bloquea móvil / ventana pequeña) → `GameProvider` carga o crea
el save y arranca la sesión → `SceneRenderer` pinta la escena de
`save.progress.sceneId`. Los cambios pasan por `dispatch` → `gameReducer` →
autosave.

Secuencia de arranque: `systemCheck` → (`boot` → `saveDetected`, solo la
primera vez) → `title`. CONTINUE → `classSelect` (solo si aún no hay clase)
→ `overworld` (exploración: La Muralla · tarde).

La demo del motor de diálogo (`dialogueDemo`) es una escena de desarrollo:
no aparece en el flujo del jugador y solo se abre en `npm run dev` con
`http://localhost:5173/?devScene=dialogueDemo`.

## Exploración (GAME-04)

Motor propio ligero (Canvas 2D) en `src/game/world/`; React sigue siendo
dueño del save, los diálogos y la UI. Un mapa es un `WorldMap` de datos
(tiles, colisiones, props, NPCs, interactuables → scripts de diálogo, zonas →
checkpoints, spawns). Controles: WASD/flechas, E/Enter/Espacio para
interactuar, Esc para el menú de pausa. En dev, `?worldRes=480` compara la
resolución del mundo (por defecto 640×360).

**Arte del mundo:** la geometría del slice vive en
`src/game/world/maps/muralla.layout.json`. El runtime solo blitea PNG.
`tools/art` mantiene un generador **placeholder** útil para prototipos, pero
los assets de producción pueden ser externos/hand-authored/AI-assisted y
sustituir esos PNG. `npm run art:check` valida que todos los PNG decodifican y
coinciden con las dimensiones/anclas del manifest; no exige identidad de
píxeles con el generador. Para comprobar específicamente los placeholders
procedurales: `npm run art:check-generated`. Dirección visual activa:
`docs/GAME_04R_VISUAL_REBUILD.md` + `docs/art/chatgpt-v2/`.

Añadir un interactuable: rectángulo en el mapa + script en
`src/game/content/dialogue/` + test (el test del mapa comprueba que todo
interactuable es alcanzable y que cada script existe y valida).

## Clases (GAME-03)

Definidas en `src/game/player/classes.ts` (`PlayerClassDefinition`). Para
contenido dependiente de clase: condición `{ kind: 'playerClass', classId }`
en diálogos o `hasPlayerClass(save, 'tank')` en código. La clase se asigna
solo con la acción `player/assignClass` y es permanente hasta un reset.

## Diálogos (GAME-02)

Un diálogo es un **grafo de datos** (`DialogueScript` en
`src/game/dialogue/types.ts`): nodos `line` (páginas), `choice` (menú),
`branch` (enrutado por condiciones) y `effect` (efectos sin UI). Nada de
funciones ni JSX en los scripts.

```
script (datos) ──► runtime.ts (puro) ──► DialogueState: line | choice | finished
                      │  evalúa Condition, emite DialogueEffect
                      ▼
               effects.ts: setFlag / recordChoice / unlockAchievement /
               goToScene → acciones del reducer; playSfx → audio;
               action → registro por id; giveItem/takeItem/giveCard/setQuest →
               "unsupported" explícito (fases futuras)
                      ▼
ui/useDialogue ─► ui/DialoguePlayer ─► DialogueBox + DialogueText + Portrait + Menu
```

- **Markup** (`markup.ts`): `[em]…[/em]` destacado · `[shake]…[/shake]`
  temblor · `[sys]…[/sys]` tono sistema · `[slow]`/`[fast]` ritmo ·
  `[pause]` / `[pause=800]` pausa · `\n` salto · `[[` corchete literal.
  Se parsea a tokens; etiquetas desconocidas se muestran literalmente y se
  reportan.
- **Typewriter** (`typewriter.ts`): velocidades centralizadas por
  `settings.textSpeed` (slow 55 ms/car., normal 30, fast 14, instant 0),
  pausas cortas tras `. ! ? …` y `, ; :`. Primer Enter/Espacio/clic revela
  la página; el siguiente avanza. Repeticiones de tecla y dobles clics
  (< 140 ms) se ignoran.
- **Voces**: `speaker.voice` → blip sintetizado (`VOICE_BLIPS`), solo en
  letras/dígitos y como máximo cada 65 ms.
- **Hablantes y retratos**: reparto global en `content/cast.ts`, retratos
  pixel en `content/portraits.ts` (base + capa por expresión). Una línea
  solo indica `speaker` y `expression`.
- **Validación**: `validateDialogueScript` (enlaces, hablantes, retratos,
  markup, longitud de página, opciones, efectos, nodos inalcanzables). Todo
  script de contenido debe tener un test que lo valide sin errores.

Crear un diálogo nuevo: script en `src/game/content/dialogue/`, test con
`validateDialogueScript`, y en la escena
`<DialoguePlayer script={…} onFinish={…} />`.

## Convenciones

- **Escenas:** una escena = una carpeta en `src/game/scenes/<id>/` +
  entrada en `SCENE_REGISTRY`. Cambiar de escena es
  `dispatch({ type: 'scene/goTo', scene })`, nunca un `if` en un componente.
- **Diálogos:** contenido como datos en `src/game/content/dialogue/`,
  validado en tests; texto de personajes en español, sistema en inglés.
- **Input:** nunca `addEventListener('keydown')` en una pantalla. Usar
  `useInput` (entradas lógicas) o `useMenu` + `<Menu>`. Prioridades en
  `INPUT_PRIORITY`.
- **Fullscreen:** solo vía `services.fullscreen` / `useFullscreen`, llamando a
  `request()` de forma síncrona dentro del gesto.
- **Guardado:** nunca usar `localStorage` directamente (ESLint lo bloquea). Todo
  pasa por `src/game/save`. Cambiar la forma del save = subir `SAVE_VERSION` +
  migración + test.
- **Tiempo:** nunca `new Date()` para reglas del juego ni fechas escritas a
  mano en componentes. Usar `services.clock` y `src/game/calendar`.
- **Tamaños:** dentro del escenario, en píxeles lógicos (`calc(var(--px) * N)`).
- **Movimiento:** animaciones cortas y escalonadas (`steps()`); todas se
  desactivan con `data-reduced-motion`.
- **Contenido como datos:** diálogos, condiciones, time gates, items… son
  datos serializables; la lógica que los evalúa es pura y tiene tests.
- **Estilos:** CSS propio, sin Tailwind ni librerías UI, sin esquinas
  redondeadas ni degradados decorativos.
- **Assets:** solo originales o con licencia compatible, registrados en
  `docs/ASSETS.md`. Nada de Pokémon/Nintendo ni otra IP protegida.
- **Idioma:** docs en español; código y comentarios en inglés.
- Tests junto al código (`*.test.ts`).

## Netlify

Listo para desplegar, aún **no desplegado**. `netlify.toml` define:

- build: `npm run build`, publica `dist/`, Node 22
- fallback SPA `/* → /index.html`
- cabeceras: `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer`, caché
  inmutable para `/assets/*`

Para desplegar (GAME-12): crear el sitio en Netlify desde este repositorio de
GitHub (la configuración se lee de `netlify.toml`), o con Netlify CLI
`netlify deploy --build` / `--prod`. No hacen falta variables de entorno.
