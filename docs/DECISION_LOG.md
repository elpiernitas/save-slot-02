# Decision log

Formato: ID · fecha · decisión · motivo · alternativas descartadas.
Las decisiones nuevas se añaden al final; si una se revierte, se añade otra
que la sustituya (no se borra la antigua).

---

### D-001 · 2026-09-25 · Stack: React 19 + TypeScript + Vite 8, npm

Motivo: pedido por la constitución; Vite da dev server rápido y build estático
ideal para Netlify. Versiones actuales en el momento de GAME-00 (React 19.3,
TypeScript 6.0, Vite 8.3, Vitest 5, ESLint 10).

### D-002 · 2026-09-25 · Sin Phaser, sin Tailwind, sin librería UI

Motivo: la dirección artística es muy específica; CSS propio con tokens da
control total. Phaser se evaluará en GAME-04 solo si exploración/minijuegos lo
justifican.

### D-003 · 2026-09-25 · Sin router

El juego es una única página; la navegación entre pantallas es **estado**
(`progress.sceneId`), no URLs. Así un refresh vuelve a la escena guardada y
no hay deep links que spoileen. `netlify.toml` incluye igualmente la regla SPA
`/* → /index.html` por si se añaden rutas (inofensiva hoy).

### D-004 · 2026-09-25 · Escenas por registro (`SCENE_REGISTRY`)

`SceneRenderer` pinta el componente registrado para `save.progress.sceneId`.
Ids sin implementación muestran un placeholder. Evita el componente gigante
con veinte condicionales.

### D-005 · 2026-09-25 · Estado: `useReducer` + Context, sin librería

Un único reducer puro (`gameReducer`) con acciones que llevan su timestamp
(`at`), sellado por el provider desde el `Clock`. Suficiente para un jugador y
un árbol pequeño. Descartado: Redux/Zustand (dependencia innecesaria hoy).

### D-006 · 2026-09-25 · Acceso a Web Storage solo en un archivo

`localStorage`/`sessionStorage` están prohibidos por ESLint
(`no-restricted-globals`) salvo en `src/game/save/localStorageAdapter.ts`.

### D-007 · 2026-09-25 · Driver de almacenamiento asíncrono

`StorageDriver` devuelve Promises aunque `localStorage` sea síncrono, para que
un driver Supabase (u otro remoto) implemente el mismo contrato sin tocar a
nadie más. Coste: un tick asíncrono al arrancar (el provider muestra
`fallback` mientras).

### D-008 · 2026-09-25 · Save versionado + migraciones encadenadas + backup

- `SAVE_VERSION` en `src/game/state/types.ts`; migraciones N→N+1 en
  `migrations.ts`.
- Un save de versión futura se rechaza (no se degrada en silencio).
- Un save ilegible se copia a `saveSlot02:save:corrupt-backup` antes de crear
  uno nuevo: nunca se destruye progreso sin copia.
- Tras migrar se rellenan secciones ausentes con valores por defecto
  (validación profunda fuera de alcance: un único jugador de confianza).
- Los ajustes (audio, velocidad de texto) viven en el save pero sobreviven a
  `resetGame()` por defecto.

### D-009 · 2026-09-25 · Tiempo: `Intl` nativo, sin librería de fechas

Conversión Europe/Madrid con `Intl.DateTimeFormat` (soportado en Safari iOS).
Todo "ahora" viene de un `Clock` inyectable. Los tests se ejecutan con
`TZ=America/Los_Angeles` para no pasar por casualidad en Madrid. Cubre los
cambios de hora (hueco de marzo, solape de octubre). Descartado: date-fns-tz /
Luxon / Temporal polyfill (peso innecesario).

### D-010 · 2026-09-25 · Viewport: escenario 16:9 con container queries

`GameViewport` crea el mayor rectángulo 16:9 dentro de las safe areas, con
`container-type: size`; los tamaños internos usan `cqh`, así la UI escala como
una pantalla de resolución fija. Resolución lógica provisional 480×270 para
pixel art (a confirmar en GAME-01/04). Requiere Safari iOS 16+ (container
queries); aceptable para el dispositivo objetivo.

### D-011 · 2026-09-25 · Sin fuente bitmap todavía

Se usa pila `ui-monospace, SF Mono, Menlo, …, monospace` como fallback seguro.
Ninguna fuente descargada. En GAME-01 se elegirá una fuente pixel con licencia
**SIL OFL** (u otra compatible), se autoalojará en `src/assets/fonts/` y se
documentará origen + licencia. Verificar la licencia en la fuente original
antes de añadirla.

### D-012 · 2026-09-25 · Audio: contrato + motor silencioso

`AudioEngine` define música/SFX/blips, mute y volúmenes por canal, bloqueado
hasta un gesto (`useAudioUnlock`). En GAME-00 solo existe
`createSilentAudioEngine` (sin assets). El motor real llega en GAME-11 con el
mismo contrato.

### D-013 · 2026-09-25 · Condiciones y time gates declarativos

`Condition` y `TimeGate` son datos serializables compartidos por diálogo,
quests, escenas y desbloqueos, evaluados por funciones puras y testeadas.

### D-014 · 2026-09-25 · Desviaciones de la estructura propuesta

Añadidas `src/game/calendar/` (fechas del proyecto + time gates; la utilidad
genérica está en `src/lib/time/`) y `src/game/audio/` (no estaba en la lista,
pero el audio es un sistema del juego). `src/components/` contiene solo UI
reutilizable no ligada a una escena; cada escena guarda sus propios
componentes/CSS en `src/game/scenes/<escena>/`.

### D-015 · 2026-09-25 · Privacidad del despliegue

`noindex` por meta, cabecera `X-Robots-Tag` y `robots.txt`; `Referrer-Policy:
no-referrer`; `<title>` neutro. Sin analítica.

### D-016 · 2026-09-25 · Idioma

Documentación en español; código, identificadores y comentarios en inglés.
El idioma del contenido del juego se decidirá con la narrativa (probablemente
español con UI "retro" en inglés, p. ej. `SYSTEM INITIALIZED`).

---

## GAME-01

### D-017 · 2026-09-25 · Pivote a desktop-first (sustituye la prioridad mobile-first)

**Sustituye:** la prioridad "smartphone en horizontal / iPhone-first" de la
constitución de GAME-00, la pantalla `ROTATE DEVICE TO CONTINUE` prevista para
GAME-01 y la prioridad de controles táctiles. D-010 (escenario 16:9) sigue
vigente, pero las safe areas dejan de ser un requisito de diseño.

**Decisión:** SAVE SLOT 02 se diseña para ordenador (portátil/sobremesa,
teclado, pantalla horizontal, preferiblemente fullscreen). Se pedirá a Luis
jugar desde un ordenador. El móvil no necesita ser jugable: se bloquea con una
pantalla diegética antes del juego.

**Motivo:** decisión de producto de Manu. Teclado + pantalla grande permiten
un RPG más rico (menús, diálogos largos, minijuegos) sin comprometer el diseño
por controles táctiles.

**Se conserva** (no molesta): `viewport-fit=cover`, safe areas vía `env()`,
`100dvh`, bloqueo de scroll/zoom.

### D-018 · 2026-09-25 · Gate de pantalla (sustituye la pantalla ROTATE DEVICE)

Lógica pura en `src/lib/display/displayGate.ts`, sin user-agent sniffing ni
listas de modelos. Señales: `(pointer: coarse)`, `(any-pointer: fine)`,
tamaño de `screen` y del viewport.

- **Incompatible** (`INCOMPATIBLE DISPLAY`, el juego no se monta y no se crea
  save): dispositivo **solo táctil** cuyo lado corto (máx. de screen y
  viewport) es < 600 CSS px → teléfonos en cualquier orientación.
- **Demasiado pequeña** (`WINDOW TOO SMALL`): viewport < **800×450** CSS px.
  800×450 es el escenario 480×270 a ≥ 1,67×: texto de 7 px lógicos ≈ 12 px
  reales, legible. Un portátil 1366×768 con la barra del navegador
  (≈1366×657) pasa de sobra. Se reevalúa en cada `resize`; si el juego ya
  estaba en marcha sigue montado debajo (estado intacto) y el input se bloquea.
- Cualquier equipo con ratón/trackpad **nunca** es "incompatible", solo
  "pequeño": algunos navegadores/emuladores reportan `screen` = ventana
  (detectado durante la QA con Playwright) y no deben bloquear un ordenador.
- Tablets grandes solo táctiles no se bloquean (pueden usar el ratón/táctil en
  menús), aunque no son objetivo.

### D-019 · 2026-09-25 · Fullscreen: abstracción + primer gesto

`src/lib/fullscreen/` es el único sitio que toca la Fullscreen API (incluye
prefijo `webkit`). `request()` nunca lanza: devuelve `entered | already |
unsupported | denied`. Se llama de forma síncrona dentro del gesto (click o
Enter) en el system check; el mismo gesto desbloquea el audio. Si se deniega o
no existe: se explica y se continúa en ventana; se puede reintentar ahí o en
SETTINGS. Nunca se usa F11 ni se obliga al fullscreen; Escape siempre sale.

### D-020 · 2026-09-25 · Secuencia de arranque y save v2

- Cada carga de página ejecuta `system/sessionStart` (cuenta sesiones y fija
  la escena en `systemCheck`): el primer gesto es necesario en cada visita
  para fullscreen/audio.
- Primera visita: systemCheck → boot → saveDetected → title.
  Siguientes: systemCheck (líneas instantáneas) → title.
- `SAVE_VERSION = 2`: añade `system { bootCompletedAt, enteredGameAt,
sessionCount, lastSessionAt }` y `progress.resumeSceneId` (última escena de
  juego; las de arranque nunca se reanudan). Migración 1→2 literal y
  congelada, con test sobre un save real v1. Timestamps en vez de booleanos
  (`hasCompletedBoot`) para tener también el "cuándo".
- CONTINUE va a `resumeSceneId` o, la primera vez, a `classSelect`
  (placeholder diegético hasta GAME-03).

### D-021 · 2026-09-25 · Fuente: Pixelify Sans (cierra D-011)

SIL OFL 1.1, autoalojada (latin 400/700, ~15 KB en total). Elegida por
legibilidad en textos largos (diálogos futuros) con personalidad pixel, sin
ser tan "arcade" como Press Start 2P. Origen y licencia en `docs/ASSETS.md`.
`font-display: block` para evitar el parpadeo con la fuente del sistema.

### D-022 · 2026-09-25 · Input: un listener, router por capas

- Un único `keydown` global (`InputProvider`) traduce teclas a entradas
  lógicas (`up/down/left/right/confirm/cancel`). WASD por `KeyboardEvent.code`
  (posición física). Nunca se capturan atajos con Ctrl/Alt/Meta.
- `InputRouter`: solo la capa superior (prioridad, luego la más reciente)
  recibe la entrada. Escena < panel < bloqueador (transiciones, gate).
- Los botones de menú son para el ratón (`tabIndex=-1`, sin foco al hacer
  click) y el teclado lo gestiona el router: así Enter nunca dispara dos
  veces. El indicador `>` + inversión de color es el foco visible. Tab no se
  usa para navegar; flechas/WASD cubren todas las acciones.

### D-023 · 2026-09-25 · Audio: SFX sintetizados con Web Audio

`createWebAudioEngine` implementa el contrato `AudioEngine` con blips
generados por osciladores (`cursor`, `confirm`, `cancel`, `boot`, `blip`): sin
archivos ni licencias. El `AudioContext` se crea en el primer gesto. Sin Web
Audio, silencio. La música sigue pendiente (GAME-11). `createSilentAudioEngine`
queda para tests. Amplía D-012.

### D-024 · 2026-09-25 · Transición de escena

`SceneRenderer`: corte a negro escalonado (3 pasos, 110 ms + 150 ms), input
bloqueado mientras dura; instantánea con movimiento reducido. El ajuste
`settings.reducedMotion` (`system` por defecto) se aplica como
`data-reduced-motion` en `.game-root` y desactiva todas las animaciones CSS.

### D-025 · 2026-09-25 · Unidad de píxel lógico `--px`

Dentro del escenario, todo se mide en píxeles lógicos del 480×270
(`--px = 100cqh / 270`). El escalado no es entero (p. ej. 1366×768 → 2,84×),
así que la nitidez perfecta de la fuente no está garantizada; a cambio el
juego llena siempre el máximo espacio 16:9. Revaluar si se añaden sprites
rasterizados (GAME-04).

### D-026 · 2026-09-25 · Title screen mínima

Solo CONTINUE y SETTINGS (FULLSCREEN, SOUND, BACK): ningún menú vacío.
Velocidad de texto y movimiento reducido se añadirán a SETTINGS cuando haya
diálogos (GAME-02).
