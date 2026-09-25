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

## Arquitectura

```
src/
  main.tsx                 entrada: monta <App/> y los estilos globales
  app/                     composición: App.tsx y services.ts (cableado de producción)
  components/              UI reutilizable no ligada a una escena (GameViewport 16:9)
  hooks/                   hooks genéricos (media query, orientación, reduced motion, audio unlock)
  lib/time/                utilidades puras de tiempo/zona horaria (Clock, DateKey, wall time)
  styles/                  tokens.css (tokens visuales) + global.css (reset móvil)
  types/                   tipos compartidos primitivos
  assets/                  assets importados por código (vacío en GAME-00)
  game/
    state/                 GameSave, reducer, condiciones, GameProvider, useGame
    save/                  persistencia: StorageDriver, localStorage, SaveManager, migraciones
    scenes/                ids de escena, registro, SceneRenderer, escenas (boot/)
    calendar/              fechas del proyecto (Europe/Madrid) + time gates
    dialogue/              contrato de datos del sistema de diálogo (motor en GAME-02)
    inventory/             tipos de items y cartas
    quests/                tipos de quests
    achievements/          tipos de logros
    audio/                 contrato AudioEngine + motor silencioso provisional
docs/                      constitución, roadmap, decisiones, handoff
```

Flujo: `App` crea los servicios (`Clock`, `SaveManager`, `AudioEngine`) →
`GameProvider` carga o crea el save → `SceneRenderer` pinta la escena de
`save.progress.sceneId`. Los cambios de estado pasan por `dispatch` →
`gameReducer` → autosave.

## Convenciones

- **Escenas:** una escena = una carpeta en `src/game/scenes/<id>/` +
  entrada en `SCENE_REGISTRY`. Cambiar de escena es
  `dispatch({ type: 'scene/goTo', scene })`, nunca un `if` en un componente.
- **Guardado:** nunca usar `localStorage` directamente (ESLint lo bloquea). Todo
  pasa por `src/game/save`. Cambiar la forma del save = subir `SAVE_VERSION` +
  migración + test.
- **Tiempo:** nunca `new Date()` para reglas del juego ni fechas escritas a
  mano en componentes. Usar `services.clock` y `src/game/calendar`.
- **Contenido como datos:** diálogos, condiciones, time gates, items… son
  datos serializables; la lógica que los evalúa es pura y tiene tests.
- **Estilos:** CSS propio, tokens en `src/styles/tokens.css`; dentro del
  escenario usar unidades `cqh`. Sin Tailwind ni librerías UI.
- **Assets:** solo originales o con licencia compatible documentada. Nada de
  Pokémon/Nintendo ni otra IP protegida.
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
