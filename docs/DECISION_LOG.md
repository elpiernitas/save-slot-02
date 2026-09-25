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
