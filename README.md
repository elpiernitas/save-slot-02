# SAVE SLOT 02

Videojuego web privado, corto y jugable: un pequeño RPG de estilo portátil
retro pensado para jugarse **en ordenador** (teclado, pantalla 16:9,
preferiblemente en pantalla completa). El móvil queda bloqueado con una
pantalla diegética. Proyecto personal, repositorio privado.

> Visión, tono, fechas y reglas: [`docs/GAME_CONSTITUTION.md`](docs/GAME_CONSTITUTION.md).
> Estado actual y siguiente paso: [`docs/HANDOFF.md`](docs/HANDOFF.md).

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
npm run check        # typecheck + lint + format:check + tests + build
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
  game/
    state/                 GameSave (v2), reducer, condiciones, GameProvider, useGame
    save/                  StorageDriver, localStorage, SaveManager, migraciones
    scenes/                ids, registro, flujo de arranque, SceneRenderer (+ transición),
                           systemCheck/, boot/, saveDetected/, title/
    input/                 keymap, InputRouter por capas, InputProvider, useInput, menú
    ui/                    Menu, useMenu, LeaderLine, PixelSprite, ui.css
    audio/                 contrato AudioEngine, motor Web Audio (SFX sintetizados)
    content/               datos de contenido (nombre del jugador…)
    calendar/              fechas del proyecto (Europe/Madrid) + time gates
    dialogue/, inventory/, quests/, achievements/   contratos (tipos) de fases futuras
docs/                      constitución, roadmap, decisiones, handoff, assets
```

Flujo: `App` crea los servicios (`Clock`, `SaveManager`, `AudioEngine`,
`FullscreenController`) → `InputProvider` (único listener de teclado) →
`DisplayGate` (bloquea móvil / ventana pequeña) → `GameProvider` carga o crea
el save y arranca la sesión → `SceneRenderer` pinta la escena de
`save.progress.sceneId`. Los cambios pasan por `dispatch` → `gameReducer` →
autosave.

Secuencia de arranque: `systemCheck` → (`boot` → `saveDetected`, solo la
primera vez) → `title`.

## Convenciones

- **Escenas:** una escena = una carpeta en `src/game/scenes/<id>/` +
  entrada en `SCENE_REGISTRY`. Cambiar de escena es
  `dispatch({ type: 'scene/goTo', scene })`, nunca un `if` en un componente.
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
