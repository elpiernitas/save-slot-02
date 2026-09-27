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

---

## GAME-02

### D-027 · 2026-09-25 · Hardening: sin actualizaciones de estado durante el render

- `SceneRenderer`: la transición es ahora una **vista derivada pura**
  (`getTransitionView` en `sceneTransition.ts`) a partir de `target`,
  `shown`, `revealing` y `reduced`. El estado (`shown`, `revealing`) solo
  cambia en callbacks de `setTimeout`. Comportamiento idéntico (cubrir 110 ms,
  revelar 150 ms, input bloqueado, instantáneo con movimiento reducido); si el
  destino cambia durante la revelación, vuelve a cubrir.
- `DisplayGate`: el "latch" (¿el juego llegó a arrancar?) sale del render y
  pasa a `nextDisplayGateState` (puro), aplicado desde el inicializador y los
  eventos `resize`/`change` en `useDisplayStatus`.
- Tests puros para ambos. Las reglas `react-hooks/set-state-in-render` y
  `set-state-in-effect` están activas en ESLint.

### D-028 · 2026-09-25 · Fullscreen: reintento sin opciones

`request()` intenta `requestFullscreen({ navigationUI: 'hide' })`; si lanza o
rechaza, y existe `requestFullscreen`, reintenta **una vez** sin opciones;
solo entonces devuelve `denied`. Sin doble intento si la API no existe; el
camino `webkit` no cambia. Limitación no verificada: si un navegador consumiera
la activación de usuario en el primer intento fallido, el reintento también se
denegaría (el juego continúa en ventana igualmente).

### D-029 · 2026-09-25 · Arquitectura del diálogo

- **Runtime puro** (`runtime.ts`): `startDialogue`, `advanceDialogue`,
  `chooseOption`, `cancelChoice`. Recibe un `DialogueHost`
  (`evaluate(condition)`, `apply(effect)`), sin React ni temporizadores.
  Estados visibles: `line` y `choice`; los nodos invisibles se resuelven en
  bucle con protección (`MAX_INVISIBLE_STEPS = 100`). Errores tipados
  (`DialogueError`: nodo inexistente, bucle, elección sin opciones…).
- **Recording host** (`effects.ts`): simula los comandos del juego con el
  reducer real sobre una copia del save (una rama tras `setFlag` ve el flag)
  y registra los efectos sin ejecutarlos.
- **Capa React** (`ui/useDialogue`): cada paso se calcula con el recording
  host; los efectos se ejecutan **después del commit** (dispatch, SFX,
  acciones). Un `DialogueError` en contenido se registra en consola y cierra
  el diálogo en vez de bloquear el juego.

### D-030 · 2026-09-25 · Cambios en el contrato de diálogo

Sin contenido previo que romper. Añadido: `NodeBase.skipTo` (destino cuando
la condición es falsa; por defecto `next`/`fallback`/fin),
`DialogueEffect.recordChoice`, `Speaker.tone` (`system`), `portrait` y
`expression` en `ChoiceNode`. `TypewriterOptions` pasa a `delayMultiplier`
(las velocidades se centralizan; los scripts no fijan caracteres/segundo).
Eliminado el `DialogueRuntimeState` provisional (sustituido por
`DialogueState`).

### D-031 · 2026-09-25 · Markup mínimo y seguro

Etiquetas cerradas: `[em]`, `[shake]`, `[sys]`, `[slow]`, `[fast]`,
`[pause]`/`[pause=ms]` (50–2000), `\n`, `[[`. Se parsea a tokens y se pinta
como spans de texto (nunca `dangerouslySetInnerHTML`). Etiquetas desconocidas
o mal cerradas: se muestran literalmente y el validador da error. Preferido
frente a tokens declarativos por legibilidad al escribir guion; el parser es
estricto para compensar.

### D-032 · 2026-09-25 · Typewriter e input

- Velocidades (ms por carácter): slow 55, normal 30, fast 14, instant 0.
  Espacios a mitad de coste. Pausas: 220 ms tras `. ! ? …`, 90 ms tras
  `, ; :`, solo al final de una racha (`...` pausa una vez) y nunca tras el
  último carácter. Escala de pausas: slow 1.2, normal 1, fast 0.5, instant 0.
- Una pulsación = una acción: escribiendo → revela; completa → avanza.
  Repetición de tecla ignorada; segunda confirmación a < 140 ms ignorada
  (dobles clics). Probado: mantener Enter ~1 s avanza una sola página.
- Todos los glifos se maquetan desde el principio y los no revelados solo se
  ocultan: las palabras no saltan de línea mientras se escriben.
- **Movimiento reducido:** no fuerza texto instantáneo (revelar texto no es
  movimiento vestibular y el jugador tiene TEXT SPEED → INSTANT); desactiva
  el temblor `[shake]`, el vaivén del ▼ y las transiciones.

### D-033 · 2026-09-25 · Voces

`speaker.voice` elige una nota sintetizada (`VOICE_BLIPS`: default,
archivist, system, narrator) con ligera variación de tono cíclica. Suena solo
en letras/dígitos, como máximo cada 65 ms (sin "metralleta"). Sin archivos.

### D-034 · 2026-09-25 · Paginación y validación

No hay división automática por caracteres. `validateDialogueScript` avisa a
partir de 110 caracteres y da error a partir de 150 o con más de 3 líneas.
Referencia medida en QA: una página de ~98 caracteres ocupa 2 líneas con
retrato en el escenario 480×270, así que 3 líneas ≈ 150. La QA comprueba
además que ningún `.dlg-text` desborde su caja. Todo script de contenido
tiene un test de validación sin errores ni warnings.

### D-035 · 2026-09-25 · Efectos

Implementados de verdad: `setFlag`, `recordChoice`/`recordAs`,
`unlockAchievement`, `goToScene` (acciones del reducer) y `playSfx`.
`giveItem`, `takeItem`, `giveCard`, `setQuest` devuelven un resultado
`unsupported` explícito (log de consola + warning del validador) hasta sus
fases. `action` se resuelve con un `DialogueActionRegistry` por id (claves
propias, nunca del prototipo); los scripts nunca contienen funciones.

### D-036 · 2026-09-25 · Settings: TEXT SPEED, MOTION y merge profundo

- SETTINGS añade TEXT SPEED (SLOW/NORMAL/FAST/INSTANT) y MOTION
  (SYSTEM/ON/OFF). MOTION describe si hay animaciones, así que MOTION ON =
  `reducedMotion: 'off'` y MOTION OFF = `'on'` (mapeo en `settingsOptions.ts`).
- **Riesgo corregido:** `settings/update` hacía un merge superficial; pasar un
  `audio` parcial podía perder `volume`. Ahora recibe un `SettingsPatch`
  (anidado y parcial) y `mergeSettings` hace merge profundo. Tests incluidos.

### D-037 · 2026-09-25 · Escena de demo

`dialogueDemo` es una escena de desarrollo (`DEV_SCENES`): nunca se guarda
como punto de CONTINUE. `CONTINUE_OVERRIDE` en `flow.ts` la abre
temporalmente desde el título; **ponerlo a `null` en GAME-03**. Los datos de
la demo usan el espacio `demo.*` en flags/elecciones/logros.

### D-038 · 2026-09-25 · Fuente del diálogo

Se mantiene Pixelify Sans: en capturas a 1366×768 y 1920×1080 el texto de 11
px lógicos es legible y conserva personalidad pixel. No se ha cambiado de
fuente; no se probó una alternativa en paralelo.

### D-039 · 2026-09-25 · Retratos provisionales

Sistema: base pixel + capa por expresión (`composePortrait`), expresión
desconocida → `neutral`. El único retrato es un placeholder original (el
Archivero, un monitor CRT) con neutral, happy, confused, annoyed, smug,
surprised y `off` (arte de escena). Los retratos definitivos no están
diseñados.

---

## GAME-03

### D-040 · 2026-09-25 · Dirección creativa: Gijón cotidiano gamificado + World Bible

El mundo pasa a ser una versión ligeramente ficcionada y gamificada del
**Gijón cotidiano**: cosas normales con lógica de RPG, humor seco, rareza
ligera, emoción sutil y la "regla del anticlímax" (lo épico acaba pidiendo
algo cotidiano). La ciudad tiene franjas (mañana, tarde, atardecer, noche) y
no es siempre nocturna. Estilo "pixel art moderno, pero no demasiado retro"
y paleta costera por franja. Se descarta explícitamente: juego nocturno,
RPG gótico, recreación cronológica de la relación, colección de recuerdos,
tarot como eje y parodia de Pokémon. Nuevo documento
`docs/WORLD_BIBLE.md` como fuente de verdad creativa; la constitución lo
enlaza sin duplicarlo. Marcas comerciales reales → equivalentes ficcionados
cuando convenga.

### D-041 · 2026-09-25 · Tarot, música y personajes

- Tarot: no central, sin clase de oráculo, como mucho easter egg sutil,
  nunca predicción real.
- Música: la playlist compartida es solo referencia estética; OST original
  en GAME-11 por zona/franja.
- Luis (PLAYER 1) elige su clase; Manu (PLAYER 2) no aparece hasta GAME-07;
  Randy (golden retriever) es secundario/easter egg. Sin retratos ni sprites
  definitivos hasta tener las referencias visuales de Manu. El Archivero de
  GAME-02 no es canon.

### D-042 · 2026-09-25 · Clases: definición central y tipo cerrado

`src/game/player/classes.ts` define `PlayerClassId = 'warrior' | 'tank' |
'healer'` (ids en inglés, nombres visibles en español: GUERRERO, TANQUE,
CURADOR) y `PlayerClassDefinition` (displayName, shortDescription,
longDescription, flavorLine, sigil, accent, traitLabels, traits). Sin
estadísticas numéricas. **No se sube `SAVE_VERSION`**: la forma JSON no
cambia (`classId: string | null`); solo se estrecha el tipo. Al cargar, un
`classId` desconocido se normaliza a `null` (test incluido).

### D-043 · 2026-09-25 · `player/assignClass` es permanente

La acción guarda la clase y marca `classSelect` como completada. Si ya hay
clase, es un no-op (devuelve el mismo save): no se puede cambiar por
accidente. Solo un reset de partida la borra. Ningún componente toca
`player.classId` directamente.

### D-044 · 2026-09-25 · Contenido por clase

Nueva condición declarativa `{ kind: 'playerClass', classId }` (diálogos,
opciones, rutas) y helper `hasPlayerClass(save, id)`. Micro-demo: el diálogo
tras confirmar (`CLASS_ASSIGNED`) ramifica por clase. Regla: las variantes
son pequeñas y el contenido principal siempre es accesible.

### D-045 · 2026-09-25 · Selección de clase y flujo

- `classSelect` es una máquina de estados pura (`classSelectMachine.ts`):
  intro → browse → confirm → assigned. Nada se guarda hasta **SÍ**; Escape
  en browse vuelve al título; Escape/VOLVER en la confirmación vuelve a
  browse.
- Flujo: TITLE → CONTINUE → `classSelect` (si no hay clase) → `overworld`.
  `resolveClassSelect` evita pedir la clase dos veces; la escena también se
  protege al montarse.
- `CONTINUE_OVERRIDE` **eliminado**. `dialogueDemo` sigue como escena DEV:
  fuera del flujo, no reanudable, y solo accesible en builds de desarrollo
  con `?devScene=dialogueDemo` (ignorado en producción; comprobado).
- `overworld` es provisional: pantalla diegética "LOADING WORLD..." con la
  clase del jugador y frases de carga; GAME-04 la sustituye por el mundo.

### D-046 · 2026-09-25 · Input: handlers en layout effects y hover por mousemove

Bug encontrado en la QA de GAME-03: pulsar → y Enter en el mismo frame
confirmaba la clase anterior, porque `useInput` refrescaba su handler en un
efecto pasivo. Ahora el handler y el registro de capas usan
`useLayoutEffect` (se aplican en el commit). Además, los menús y tarjetas
seleccionan por `mousemove` en vez de `mouseenter`, para que un menú que
aparece bajo un puntero quieto no robe la selección del teclado. Afecta a
todos los menús; la QA posterior lo confirma.

### D-047 · 2026-09-25 · Arte de clase provisional y paleta del mundo

Sigilos pixel propios y abstractos (doble chevrón, muro, brote; sin espadas,
escudos ni cruces médicas) y una silueta genérica sin rasgos que **no** es
Luis. Tokens `--world-*` (marino, costa, crema, piedra, coral, cálido) y
acentos de clase añadidos a `tokens.css`. Sprites reales de Luis, Manu y
Randy: más adelante, a partir de referencias de Manu.

---

## GAME-04

### D-048 · 2026-09-25 · Motor de exploración: propio (Canvas 2D), no Phaser

Spike: Phaser 4.2.1 pesa ~1,38 MB minificado (~355 KB gzip), unas 4× el
juego entero (~89 KB gzip antes de GAME-04), y trae bucle, gestor de
escenas, input y estado propios que competirían con el `InputRouter` y con
React como dueño del save; sus tests necesitarían DOM/canvas.

Motor propio (`src/game/world/`), comparado con los criterios:

| Criterio                       | Cómo lo cubre                                               |
| ------------------------------ | ----------------------------------------------------------- |
| WASD/flechas, 4 direcciones    | `InputRouter.heldDirection()` + `stepMovement`              |
| Colisión sólida                | `buildCollisionWorld` (tiles + rectángulos + bordes)        |
| Cámara                         | `cameraFor` (centrada, limitada, píxeles enteros)           |
| Zonas / triggers               | `zoneAt` + `onZoneEnter`                                    |
| Interacción E/Enter/Espacio    | `findInteraction` frontal + `tryInteract`                   |
| Pausa con DialoguePlayer       | capa de input `world` por debajo + `setPaused` + cooldown   |
| Añadir mapas/NPCs/puzzles      | mapas como datos (`WorldMap`), scripts por id               |
| No duplicar estado persistente | el motor solo tiene estado efímero; eventos → reducer       |
| Teardown limpio                | `destroy()` cancela el frame; la escena quita capa/observer |

Toda la lógica es pura y se testea en Node. Coste medido: el bundle pasa de ~89 a ~99 KB gzip (motor, mapa, arte y escena incluidos). Un solo
motor; Phaser queda descartado salvo que un minijuego futuro lo justifique
(se documentaría como decisión nueva).

### D-049 · 2026-09-25 · Resolución del mundo: 640×360

Comparación con el slice real (mismo arte, `?worldRes=480` en dev):

- **480×270**: sprites grandes (≈96 px a 1080p) pero el encuadre recorta el
  lugar: fachada y árbol casi fuera; se lee como un fragmento.
- **640×360**: el encuadre muestra fachada, terraza, árbol y calle a la vez;
  el entorno tiene más detalle que los personajes (lo que pide la dirección de
  arte). Escala entera ×3 a 1080p. Personaje ≈72 px a 1080p y ≈51 px a
  1366×768: legible.

Se adopta 640×360 solo para el mundo; la UI sigue en su rejilla 480×270.
Render: backing store = vista × ⌈escala⌉ con vecino más cercano y el
navegador lo reduce un poco hasta el tamaño del escenario (sin píxeles
desiguales; ligera suavidad en tamaños no enteros). Si la QA real pide
personajes más grandes en portátiles: zoom de cámara, no otra resolución.

### D-050 · 2026-09-25 · Arquitectura de exploración

Separado en: datos de mapa (`maps/`), colisión (`collision.ts`), movimiento,
cámara, interacción/zonas, checkpoints, motor (`engine/WorldEngine.ts`),
render (`render/canvasRenderer.ts`), arte (`art/`), puente mundo → diálogo
(`scripts.ts`) y adaptador React (`scenes/overworld/OverworldScene.tsx`).
Input: el router guarda teclas mantenidas (keyup/blur) y la capa `world`
tiene prioridad propia por debajo de las escenas, para que cualquier diálogo
o menú tenga el input (bug encontrado en QA: con la misma prioridad el mundo
se tragaba el Enter del diálogo de llegada). `E` = confirmar/interactuar.

### D-051 · 2026-09-25 · Checkpoints sin cambiar el save

Se reutiliza `progress.checkpoint` como `"<mapa>:<spawn>"`, actualizado al
entrar en una zona (acción `progress/checkpoint`). No se guarda posición
exacta ni estado del motor. **Corrección:** antes ir al título o empezar
sesión ponía el checkpoint a `null`; ahora pertenece a la escena de
reanudación y sobrevive al título y al refresh (solo se resetea al entrar en
otra escena de juego). Sin cambio de forma JSON → `SAVE_VERSION` sigue en 2.

### D-052 · 2026-09-25 · Arte del slice

> **Sustituida por D-054/D-055/D-056** tras la revisión visual de Manu: la
> "muralla con puerta" fue una interpretación errónea y el arte procedural no
> alcanzaba el nivel pedido.

Todo original y generado por código (personajes y props como datos pixel,
suelo/fachadas procedurales con ruido determinista), coherente con
`ART_DIRECTION_V1.md`: adoquines, muralla, terraza con sombrillas, árbol
frondoso, fachada de café con luz cálida, calle; luz de tarde desde el oeste
(sombras al este) y un leve tinte cálido. Sin CRT/scanlines. PLAYER 1 es un
sprite provisional inspirado en el vestuario canónico de Luis sin afirmar
likeness. Animaciones: pasos, árbol, gaviotas y guirnalda (congeladas con
movimiento reducido, salvo los pasos).

### D-053 · 2026-09-25 · Imagen de concepto ilegible

`docs/art/visual-concept-v1.jpg` (commit `c2dd94e`) está **truncado**: 7,5 KB,
sin marcador de fin de imagen y solo 2 scans progresivos; ni Chromium lo
decodifica. GAME-04 se ha guiado por `ART_DIRECTION_V1.md`. Pendiente: volver
a subir la imagen completa y revisar el slice contra ella.

## GAME-04 · revisión visual

### D-054 · 2026-09-25 · La Muralla es el bar, no una muralla

Revisión visual de Manu (comentario en el PR): **GAME-04 no aceptado
visualmente**. "La Muralla" es el **bar/café** donde Manu y Luis se
conocieron, no una muralla defensiva. Se elimina por completo la idea de
muro, puerta de piedra y almenas. El slice pasa a ser una **calle peatonal
urbana de Gijón (Cimavilla, tarde)**: fachada del bar con rótulo LA MURALLA,
terraza con sombrillas beige y cortavientos de cristal, dos árboles grandes,
fachadas de viviendas detrás, adoquín/losa de granito, bolardos, un portal,
una persiana bajada y una frutería. Recorrido compacto (800×416 px), no una
plaza gigante. El juego sigue **sin explicar** por qué el sitio importa.

Motor, movimiento, colisiones, cámara, interacción, puente de diálogos,
checkpoints y 640×360 se mantienen. Interactuables: se quitan `wall`, `gate`
y `sign`; entran `board` (pizarra), `portal`, `shutter`, `barWindowLeft`/
`barWindowRight`, `barDoor`. Se conservan árbol, mesa libre, bolardo
(variante por clase) y camarera. Los checkpoints antiguos `muralla:gate`
vuelven al spawn por defecto (fallback existente); no cambia la forma del
save (`SAVE_VERSION` sigue en 2).

### D-055 · 2026-09-25 · Arte raster (PNG) generado offline

El renderer ya no pinta rectángulos en tiempo de ejecución: solo **blitea
PNG**. El arte se genera de forma determinista con scripts Node propios
(`tools/art/*.mjs`: lienzo con mezcla alfa, rampas con dithering ordenado,
contorno selectivo, fuentes pixel propias 3×5 y 5×7) y se **commitea** en
`src/assets/world/muralla/` con un `manifest.json` (tamaño de frame, anclas).
`muralla.layout.json` es la fuente única de la geometría: la usan el
generador de arte y el mapa (colisiones), así que no pueden desalinearse.
`npm run art` regenera; `npm run art:check` (dentro de `npm run check`)
falla si los PNG del repo no coinciden píxel a píxel con el generador.

Limitación honesta: no hay editor de pixel art en este entorno, así que los
assets siguen siendo **arte generado por código**, aunque ahora como imágenes
raster con sombreado, dithering, contorno selectivo y luz de tarde. Si Manu
aporta PNG dibujados a mano, sustituyen a los generados con el mismo nombre y
ancla (y se retira el generador para ese asset).

### D-056 · 2026-09-25 · Escala del personaje: 32×48

Los personajes de mapa pasan de 16×24 a **32×48** (a 640×360: ≈144 px de
alto en 1080p, ≈102 px en 1366×768). Pies de colisión 14×6 y alcance de
interacción 14 px. Se descarta el zoom de cámara: con 32×48 el personaje es
legible sin perder encuadre. PLAYER 1 sigue siendo **provisional**: pelo
oscuro con raya al medio, camiseta blanca de manga larga con corazón negro,
vaqueros; sin afirmar likeness.

La referencia visual `docs/art/visual-concept-v1.jpg` sigue truncada (D-053):
esta reconstrucción se ha guiado por el comentario de revisión y
`ART_DIRECTION_V1.md`, no por la imagen.


### D-057 · 2026-09-26 · Arte final externo al generador procedural

D-055 sigue describiendo la **tubería raster** útil, pero deja de ser la
fuente estética final. Los PNG producidos por `tools/art` son placeholders
de integración/regresión mientras se sustituyen por assets aprobados.

La dirección visual activa se encuentra en:
- `docs/art/chatgpt-v2/`
- `GAME_04R_VISUAL_REBUILD.md`
- `ASSET_IMPORT_CONTRACT.md`
- `ASSET_MANIFEST_V2.md`

Claude Code integra assets, anclas, colisiones y QA; no debe recrear el
resultado final íntegramente con rectángulos/procedural art. Los assets
externos pueden sustituirse archivo a archivo sin cambiar la lógica del
motor.

### D-058 · 2026-09-26 · Modelo de colaboración ChatGPT ↔ Claude

El PR #1 funciona como canal operativo compartido.

- Manu: owner y veto de decisiones grandes.
- ChatGPT: producto, narrativa, dirección visual y QA/acceptance.
- Claude Code: implementación principal dentro del repo.

Flujo:
spec → implementación → screenshots/tests → revisión ACCEPT/FIXES/NEXT.

Manu no hace de mensajero para decisiones rutinarias.

Fuente: `docs/AI_COLLABORATION.md`.

### D-059 · 2026-09-26 · CI del PR

Se añade `.github/workflows/ci.yml` para ejecutar `npm ci` +
`npm run check` en pull requests y ramas de trabajo. Un milestone no debe
entregarse como verde si CI está rojo.

Esto corrige la carencia repetida de "no CI configured" detectada durante
GAME-00→04.

### D-060 · 2026-09-26 · Critical path de release

Objetivo de envío: 28-09-2026.

Se prioriza completar el arco:
GAME-04R → core 05 → core 06 → 07 → 08 → 09 → polish P0 → 12.

Si falta tiempo se recorta **cantidad**, no la calidad visual del primer
slice:
- GAME-10 es totalmente cortable;
- SEAGULL PROTOCOL y extras de GAME-06 son cortables;
- GAME-05 puede reducirse a CITY CARDS;
- boss puede simplificarse pero PLAYER 2 reveal no se elimina;
- date gate y ending no se eliminan.

Fuente: `docs/RELEASE_CRITICAL_PATH.md`.

### D-060 · 2026-09-26 · GAME-04R iteración 1: integración sin arte aprobado

Las tres referencias de `docs/art/chatgpt-v2/` **no se pueden usar**:
`visual-bible.jpg` y `ui-flow-storyboard.jpg` no decodifican (datos corruptos
desde el byte 158) y `ui-reference-board.jpg` decodifica a 1200×500 pero
en blanco (solo llegó parte del primer scan progresivo). Por
`ASSET_IMPORT_CONTRACT.md` no se ha generado arte nuevo: los PNG siguen
siendo los placeholders de `npm run art`, ahora marcados
`status: "placeholder"` en `manifest.json` (un test exige
`placeholder | final` en cada sprite).

Implementado sin depender del arte:

- Cámara con **seguimiento suave y zona muerta** (±24/±16 px), que llega a
  los bordes del mapa (`followCamera`, tests).
- UI del mundo con la gramática de `UI_SYSTEM_V2.md`: panel navy, texto
  crema, selección dorada, borde coral, SYSTEM en verde (tokens
  sobrescritos solo dentro de `.overworld`).
- Prompt `E INTERACT` **anclado encima de PLAYER 1**; la ayuda de controles
  desaparece tras el primer movimiento.
- La caja de diálogo **sube arriba** cuando PLAYER 1 está en la mitad
  inferior de la pantalla (`placement` en `DialoguePlayer`): el diálogo
  nunca lo tapa.
- Huella de colisión de la camarera más profunda: PLAYER 1 se queda un paso
  por delante y no tapa su sprite.
- Fuera el tinte naranja global (`GAME_04R_VISUAL_REBUILD` §8).

Capturas de revisión: `docs/art/review/game-04r-iter1/`.

### D-061 · 2026-09-26 · GAME-04R iteración 2: rebuild de la capa visual

Manu marcó la iteración 1 como **FAIL visual** (suelo vacío, fachada plana,
poca vida, personajes pequeños, paleta beige, poca profundidad) y pidió un
rebuild de la presentación manteniendo motor, save, diálogos e
interacciones. Las referencias `chatgpt-v2/*.jpg` siguen sin decodificar, así
que el rebuild sigue la dirección **escrita** (`GAME_04R_VISUAL_REBUILD`,
`GAME_04R_LAYOUT_SPEC`, `ART_DIRECTION_V1`, `UI_SYSTEM_V2`); falta
contrastarlo con las imágenes.

- **Escala**: personajes 40×60 (antes 32×48), con cara legible, luz cálida y
  sombra fría; entorno reescalado (~34 px/m). Mapa 960×400.
- **Composición**: el bar ocupa el tercio superior (rótulo grande, toldos,
  escaparates con interior vivo, puerta retranqueada, lámparas); terraza en
  el centro con mesas ocupadas (9 clientes sentados), sombrillas beige y
  cortavientos; árbol grande a la izquierda; banco con lector, bici, gaviota,
  bolardos delante.
- **Vida**: 3 peatones de fondo animados (sin colisión, quietos con
  movimiento reducido).
- **Profundidad y luz**: capa de primer plano (follaje en las esquinas),
  sombra fría del edificio de enfrente sobre el primer plano, sol rasante
  sobre la terraza, sombras largas hacia el este, luz cálida del bar sobre la
  acera.
- **Interacciones** según §10: árbol, pizarra, mesa libre, bolardo (variante
  por clase), escaparates y puerta del bar, camarera. Fuera portal y persiana.
- La caja de diálogo de llegada se coloca según el spawn (arriba si PLAYER 1
  está abajo); el prompt va junto a la cabeza de PLAYER 1, sin tapar al NPC.
- Carga de sprites por nombre de archivo (`import.meta.glob`): sustituir un
  PNG no requiere tocar código.

Todo el arte sigue siendo **placeholder generado por código**
(`status: "placeholder"`). Capturas: `docs/art/review/game-04r-iter2/`.

### D-062 · 2026-09-26 · GAME-04R: estructura aceptada, modo integración

Manu acepta la **estructura, la composición base y la integración** de la
iteración 2 (`ef9282b`). No se itera más la escena sin assets finales.

Siguiente paso: al llegar **CHAR-001** (`player.png`, 120×240, frames 40×60,
ancla 20,57) y **ENV-001** (`background.png`, 960×400) se sustituyen los
placeholders, se reajustan anclas/colisiones si hace falta, `npm run check`,
capturas, y entonces se decide el ACCEPT final de GAME-04R.

### D-063 · 2026-09-26 · GAME-04R: CHAR-001 (Luis) integrado como final

`player.png` = CHAR-001 de ChatGPT, importado con `npm run art:import` y
marcado `final` (120×240, 3×4 frames de 40×60, ancla 20,57 sin cambios: los
pies terminan en y=56–57 en todos los frames).

Transporte: el PNG llegó en base64 troceado (`docs/art/incoming/`). `part5`
tenía un carácter alterado (`v`→`V`, posición 1173); la corrección es la
única sustitución que reproduce su SHA-256 publicado, y el PNG resultante
coincide en tamaño (7827 B), SHA-256 y blob git con los de ChatGPT, así que
es idéntico byte a byte al original. No hay redibujado ni reinterpretación.

Capturas nativas 640×360: `docs/art/review/char-001/`. ENV-001 no se toca
hasta la revisión de CHAR-001 en contexto.

### D-064 · 2026-09-26 · GAME-04R: reparto de roles y dirección visual

Manu fija el reparto: **ChatGPT** lleva la dirección creativa visual; **Claude**
integra el arte final y se ocupa solo de lo técnico (anclas, colisiones,
layering, cámara, recortes, importación, validación, tests, capturas de QA).

- CHAR-001 (Luis) aceptado y congelado: no se redibuja ni se reproporciona.
- La escena de La Muralla **no** está aceptada. Dirección objetivo: pixel art
  moderno e ilustrado, tarde cálida, profundidad real con foreground /
  midground / background, foreground que enmarque, terraza viva, fachada con
  encanto, menos mapa plano y menos adoquín.
- Sin aproximaciones procedurales del estilo. Los placeholders son solo
  soporte técnico y no se presentan como dirección visual.
- El arte que falte se pide como contrato técnico (nombre, tamaño, alfa,
  ancla, huella de colisión, uso en runtime).
- Siguiente bloqueante: ENV-001 (y FG-001, la capa de foreground). Al llegar:
  integrar sin rediseñar y devolver 4 capturas (sin HUD, Luis ante el café,
  interacción en terraza, 1366×768). Sin GAME-05 ni merge hasta cerrar GAME-04R.

### D-065 · 2026-09-26 · GAME-04R: ENV-001 integrado con ambiente horneado

`background.png` = ENV-001 de ChatGPT (960×400, opaco), importado sin cambios
(0 píxeles distintos del entregado) y marcado `final`. Por decisión de ChatGPT
(PR, comentario 5846820753) el ambiente decorativo va pintado en el fondo:
comensales, camarera, peatones, árbol, banco, bici, gaviotas, farola, bolardos.

- El mapa ya no dibuja props, NPCs ni peatones (duplicarían lo pintado). El
  foreground placeholder se desactiva hasta que llegue FG-001.
- Colisiones y hotspots medidos sobre ENV-001 (coordenadas 1:1). El arte deja
  poco suelo libre: PLAYER 1 recorre la acera ante la terraza y la esquina del
  árbol; puerta, escaparates y camarera se miran desde el suelo libre más
  cercano.
- Pendiente de ChatGPT: escala de Luis frente a las figuras pintadas (~½),
  artefactos en ENV-001 (franja central, rótulo) y textos que ya no casan con
  el arte (mesa libre, pegatina del bolardo).

Capturas: `docs/art/review/env-001/`.

### D-066 · 2026-09-26 · GAME-04R: reconstrucción fiel de la referencia de ChatGPT

Manu fija que las imágenes de ChatGPT son la especificación visual. Plan en el
PR (comentario 5847081795), ejecutado así:

- **Fondo = ENV-001 píxel a píxel.** Terraza, camarera, banco con lector, bici
  y árbol quedan pintados; las colisiones mantienen a PLAYER 1 en la acera,
  siempre delante de ellos, así que el orden fondo → Luis es correcto.
- **Oclusores** (`tools/art/occluders.mjs`): farola, pizarra, 3 bolardos,
  papelera y 2 gaviotas, recortados de ENV-001 con su contorno, colocados
  donde se cortaron y ordenados por Y. Tapan a Luis cuando pasa detrás; si no,
  son idénticos al fondo. Sin arte nuevo.
- **Escala:** PLAYER 1 usa `playerLarge` = CHAR-001 ×2 exacto
  (`tools/art/scale-player.mjs`), ~108 px como los adultos de la referencia.
  CHAR-001 original intacto. Cambio mínimo: `WorldMap.playerSprite` y sombra
  de contacto proporcional al sprite.
- Tests de guarda: sin atravesar (cada sprite sobre su collider), PLAYER 1
  único, oclusores solo con píxeles de ENV-001.

Pendiente de ChatGPT: franja central y rótulo de ENV-001; CHAR-001 nativo a
80×120 si se quiere más detalle que el ×2; textos de "mesa libre"/pegatina.

### D-067 · 2026-09-26 · GAME-04R: FIXES de ChatGPT — textos y HOLD visual

ChatGPT acepta la estrategia de reconstrucción (D-066) y pide FIXES
(comentario 5847187352):

- Textos corregidos a lo visible en ENV-001: la terraza está llena (mesa y
  respuesta de la camarera), el bolardo es de hierro oscuro sin pegatina.
- `playerLarge` (×2) es solo proxy de integración, no arte final. ENV-001 es
  provisional (franja central, rótulo).
- HOLD visual hasta recibir ENV-001 corregido (misma composición 960×400) y
  CHAR-001 nativo 240×480 con frames de 80×120. Sin mover composición ni
  añadir props mientras tanto. Sin GAME-05, sin merge.

### D-068 · 2026-09-26 · GAME-04R cerrado; siguiente GAME-05

ChatGPT (director) acepta GAME-04R como base visual jugable (PR, comentario
5847231933) y cierra el bloqueo por arte: la composición de `17d6b53` es la
canónica de La Muralla y queda congelada; los textos se alinearon en
`df8868d`. Dos deudas pasan a GAME-11: Luis nativo 80×120 por frame (hoy
`playerLarge` ×2) y ENV-001 sin la franja central ni el fallo del rótulo.
Siguiente: GAME-05 (inventario + CITY CARDS originales). Sin merge ni deploy.

### D-069 · 2026-09-26 · GAME-05: inventario + CITY CARDS

Implementado según `docs/GAME_05_SPEC.md` y `docs/CITY_CARDS_BIBLE.md`:

- Contratos estáticos: categorías `quest/object/consumable/key`; cartas con
  número, tipo (`place/object/npc/event/system`), rareza visual, arte y
  `hiddenUntilOwned`. Save sin cambios (`SAVE_VERSION` 2).
- Registros solo con lo que el juego concede: cartas 001 LA MURALLA y 002
  BOLLARD Lv. ???; items vacío (ningún candidato encaja todavía en la escena).
- Arte de carta = ventana sobre ENV-001 (píxeles de ChatGPT), sin archivos ni
  herramientas nuevas.
- Recompensas: 001 en la primera conversación con la camarera, 002 en el
  primer vistazo al bolardo (cualquier clase). Nada más da recompensa.
- El aviso aparece al cerrar el diálogo (se comparan owned antes/después);
  el mundo sigue en pausa hasta cerrarlo, con cooldown para que Enter no se
  filtre.
- Pausa: CONTINUAR, INVENTARIO, CITY CARDS, VOLVER AL TÍTULO. Binder sin
  contador de colección; NEW hasta abrir la carta.

### D-070 · 2026-09-26 · GAME-06: ROUTE BEACONS + SYNC TERMINAL en La Muralla

- Ubicación: La Muralla, no Cholo (no hay arte de Cholo; plan en el PR,
  comentario 5847383771, opción A). Cambiar a un segundo mapa será cambio de
  datos cuando exista ENV-002.
- Núcleo: registro `src/game/puzzles/registry.ts`, `puzzle/complete` (gana la
  primera, intentos ≥1, no-op en duplicado), condición `puzzleCompleted`.
  Save sin cambios (`SAVE_VERSION` 2); el estado transitorio no se guarda.
- Flujo (`src/game/puzzles/chapter.ts`): tras la primera charla con la
  camarera, `SIDE QUEST ROUTE UPDATED` → patrón (1 CUP, 2 LAMP, 3 BIRD,
  repetible en la puerta del 12) → balizas pizarra/farola/gaviota → error =
  reset + intento + pista (1ª: primer símbolo; 2ª: orden completo) → carta 005
  → `SERVICE ACCESS` → SYNC TERMINAL.
- SYNC TERMINAL: 3 tiles giratorios (canal PLAYER 1), PLAYER 2 inactivo y no
  interactivo; `PLAYER 2 INPUT… NOT FOUND` → fallback → `RECOVERY PROCESS
  ERROR`; flag `system.player2SignalMissing`. No nombra ni insinúa a Manu.
- MG-01 SEAGULL PROTOCOL recortado: opcional, y exigiría inventar visuales
  de arena. Queda para GAME-11 si hay tiempo.

### D-071 · 2026-09-26 · GAME-07: DESYNC PROCESS + PLAYER 2 (Manu)

- Save sin cambio de versión (`SAVE_VERSION` 2). `boss/attempt` (+1, no-op
  tras la derrota) y `boss/defeat` (gana la primera, intentos ≥1). Flags
  genéricos `story.player2Found` (al mostrarse PARTY STATUS — 2/2) y
  `story.player2GateComplete` (al abrirse la puerta).
- Enrutado puro `storyScene` (`src/game/boss/story.ts`), consultado primero
  por CONTINUE: gate completo → `dateGate` (GAME-08, sin implementar);
  derrotado → `player2Reveal`; terminal hecho → `boss`. Un refresh nunca
  repite el boss.
- RECOVERY PROCESS ERROR pasa directo a `boss` (sin paso intermedio).
- Boss: estado puro `advanceBoss(state, dt, input)` en
  `src/game/boss/desync/state.ts`, sin RNG, dt limitado a 50 ms, probado a
  60/120/144 Hz. Mecánica única: estabilizar nodos (3 commits por nodo, uno
  por ciclo de peligro, bloqueo de 300 ms) esquivando barridos, pulsos y un
  anillo final, todos con aviso (contorno + chevrons) antes de estar activos.
  Fases CHECKSUM MISMATCH (A) → SIGNAL SPLIT (B + C) → MISSING CHANNEL
  (anillo → núcleo `E — RECOVER INPUT`). SIGNAL 3/3, 1 s de invulnerabilidad.
- Fallo: SIGNAL LOST → RETRY / RETURN TO TITLE; la intro no se repite. Tras 2
  fallos, ASSIST MODE AVAILABLE ("Longer warnings. Same result."): avisos
  ×1,3. Se descartó el "velocidad ×0,78" del plan: los peligros no se
  desplazan, así que el aviso es la única palanca real.
- Clase: solo microlínea de sistema en el banner de CHECKSUM MISMATCH.
- Reveal (`src/game/boss/reveal/`): SCANNING → SIGNAL FOUND → PLAYER SLOT 02 /
  IDENTITY DATA RECOVERED → PLAYER 2 — MANU → MANU: "¿me ha cargado bien por
  lo menos?" → PLAYER LINK — STABLE / PARTY STATUS — 2/2 → gate cooperativo →
  FINAL SIDE QUEST DATA RECOVERED / DESTINATION DATA AVAILABLE → `dateGate`.
  Re-entrada tras refresh: versión comprimida (sin SCANNING ni tarjeta, con la
  línea humana); con `player2Found`, solo el gate.
- Sin asset de Manu: identidad tipográfica (nombre como texto) y, en el gate,
  un marcador de sistema "MANU" (anillo + etiqueta), sin figura ni cara.
  CHAR-003/004 pendientes; entran sin rediseño.
- Gate: máquina pura con waypoints fijos, salvaguarda de 6 s y salto
  inmediato con reduced motion; no puede bloquearse.
- Única cadena de UI fuera del copy bloqueado: el aviso `E — READY` junto al
  interruptor de PLAYER 1.

### D-072 · 2026-09-26 · GAME-08: date gate

- Ejecución autónoma GAME-07 → GAME-12 autorizada en el PR (comentario
  5847703452): cada milestone se cierra con check, QA, commit e informe, y se
  avanza sin esperar ACCEPT. Sin merge ni deploy.
- Fechas solo desde `src/game/calendar`: `getDateRoutes` /
  `getAvailableDateOptions` / `isDateOptionAvailable` (Europe/Madrid; una ruta
  vale todo su día y caduca al siguiente). Etiquetas derivadas de `dateKey`
  en `src/game/dateGate/routes.ts`; no hay una segunda lista de fechas.
- Escena `dateGate`: cuatro puertas en orden de calendario. El viernes se
  muestra como `MAIN QUEST ALREADY ACTIVE` / `18:30 · THEATRE`, iluminado y
  nunca seleccionable. Una sola línea humana (Manu, de GAME_08_COPY).
- Guardado solo con YES: `date/choose` (id canónico, la primera gana, nunca se
  sobrescribe). BACK/Esc y el resaltado no escriben. → `ROUTE LOCKED` →
  `SAVING...` → `ending`. `storyScene`: ruta elegida → `ending`, partida
  completada → `saveSlot`.
- Todas las rutas caducadas (desde el 5 oct): `ROUTES EXPIRED` con una línea
  en castellano; no se puede elegir una fecha pasada.
- Sin microlínea de clase: la spec la deja opcional y no añade nada aquí.

### D-073 · 2026-09-26 · GAME-09: final + save slot persistente

- `game/complete` (la primera gana; exige ruta elegida, así que un guardado
  completado nunca muestra una fecha nula). `storyScene`: completado →
  `saveSlot` (CONTINUE y refresh).
- Escena `ending` (`src/game/ending/`): `SAVING...` → `CHECKSUM — OK` /
  `SIDE QUEST — COMPLETE` (aquí se escribe `completedAt`) → Luis + marcador
  MANU con una línea: "bien. ahora ya solo falta hacer la parte que no cabe
  aquí." → `DATE ROUTE` + fecha canónica en largo → `SAVE SLOT 02 — UPDATED`
  → `saveSlot`. Un refresh a partir de COMPLETE aterriza en el slot.
- Escena `saveSlot`: PLAYER 1 / CLASS / PLAYER 2 / SIDE QUEST / DATE ROUTE, y
  menú CITY CARDS, SETTINGS, RETURN TO TITLE. No hay reset ni "play again";
  nada en esta pantalla cambia la fecha.
- Sin hora ni lugar inventados; sin créditos automáticos.

### D-074 · 2026-09-26 · GAME-10: CUT FOR RELEASE

- Post-game recortado. Es la primera fase recortable (RELEASE_CRITICAL_PATH)
  y añadiría superficie de QA antes del 28 sin tocar la ruta crítica.
  `TimeGate` y `relativeToChosenDate` siguen disponibles para retomarlo.

### D-075 · 2026-09-26 · GAME-11: pulido P0 de la ruta crítica

- Música procedural original (`src/game/audio/music.ts`): un motivo de cinco
  grados transformado en cuatro pistas (`system`, `muralla_afternoon`,
  `desync`, `ending`). Programada por adelantado con el reloj de audio, un
  nodo de ganancia por pista (fundidos, volumen de música, mute). Nada suena
  antes del primer gesto. Enrutado central `musicForScene`, aplicado en
  `SceneRenderer`. Sin pista `puzzle`: los puzzles son overlays del mundo y
  cambiar de pista al abrir/cerrar sería más ruido que ayuda.
- SFX nuevos (interact, cardGet, puzzleWrong/Complete, warning, hit, bossNode,
  bossDefeat, signalFound, save, gateLocked, gateOpen) usados en balizas,
  cartas, jefe, reveal, date gate y final. Voz `manu` preparada.
- Título tras completar: `SIDE QUEST: COMPLETE`. `ROUTES EXPIRED` ya no es un
  callejón: Enter/Esc vuelve al título.
- Bundle de producción: sin handles de QA (`__desync`, `__reveal`,
  `__worldEngine`). `AREA NOT GENERATED` solo queda como red de seguridad para
  ids sin escena (`dungeon`, inalcanzable).
- Recortado (P1/P2): logros, cameo de Randy, easter eggs, SEAGULL PROTOCOL.
- Deuda no bloqueante: Luis nativo 80×120 y limpieza de ENV-001 (sin asset);
  sprite/retrato de Manu (CHAR-003/004); en Pixelify Sans la C mayúscula se
  confunde con la O a tamaños pequeños (cambiar de fuente sería un cambio de
  dirección visual, queda para ChatGPT/Manu).

### D-076 · 2026-09-26 · GAME-12: release candidate (sin merge ni deploy)

- QA de producción en local; resultados en `docs/RELEASE_CHECKLIST.md`
  (sección "Estado RC") y capturas en `docs/art/review/game-12/`.
- El recorrido completo automatizado usa el servidor de desarrollo porque el
  bot del jefe necesita `window.__desync`, que no existe en producción. El
  build de producción se verifica escena a escena con guardados sembrados.
- Solo Chromium disponible en este entorno: Safari y Firefox quedan para la
  revisión final de Manu.
- Deuda no bloqueante: sprite/retrato de Manu, Luis nativo 80×120, limpieza
  de ENV-001, legibilidad de la C en Pixelify Sans.

### D-077 · 2026-09-26 · Idioma del jugador: castellano (director, 5847918411)

- Todo el texto visible pasa a castellano, también el de GAME-00→06. IDs,
  claves de guardado, nombres de archivo, tests y documentación técnica
  siguen en inglés. No hay infraestructura i18n: el copy canónico está en el
  código.
- Se mantienen como etiquetas establecidas: PLAYER 1 / PLAYER 2, SAVE SLOT 02,
  CITY CARDS, LA MURALLA, MANU, DESYNC (nombre del proceso), CHECKSUM, HOLO y
  los nombres de teclas (ENTER, ESC, E, WASD).
- Glosario: CONTINUAR, AJUSTES, VOLVER, ELEGIR, REINTENTAR, VOLVER AL TÍTULO,
  MISIÓN SECUNDARIA, SEÑAL, SEÑAL ENCONTRADA, DATOS DE IDENTIDAD RECUPERADOS,
  ENLACE DE JUGADORES — ESTABLE, GRUPO — 2/2, MODO ASISTIDO, RUTA FIJADA.
  "¿me ha cargado bien por lo menos?" no cambia.
- Fechas en castellano natural: `MIÉ · 30 SEP` en las puertas, "Jueves · 1 de
  octubre" en la confirmación y `JUEVES · 1 DE OCTUBRE` en el final. Viernes:
  `MISIÓN PRINCIPAL YA ACTIVA` / `18:30 · TEATRO`.
- Se evita "destino" (lista negra por su lectura romántica): `ELIGE RUTA` y
  `DATOS DE RUTA DISPONIBLES`.
- Los docs de copy (GAME_07_COPY, GAME_08_COPY) quedan como dirección en
  inglés; el texto final es el del código.
- Filtro de idioma en la QA: el recorrido completo recoge cada nodo de texto
  visible y falla si aparece vocabulario en inglés fuera de la lista anterior.

### D-078 · 2026-09-26 · RC-FIX-01: auditoría de idioma y glifo C

- Test estático `src/game/content/visibleCopy.test.ts`: recorre todo `src`
  (menos tests y la demo de desarrollo) y falla si un literal o texto JSX
  contiene vocabulario de UI en inglés fuera de las etiquetas aceptadas.
  Se comprobó que detecta una regresión inyectada.
- `PANTALLA NO COMPATIBLE` (redacción del director). La etiqueta del viernes
  vuelve a salir de `calendar.ts` (`MISIÓN PRINCIPAL YA ACTIVA`), una sola
  fuente. Títulos internos de puzzles también en castellano.
- Glifo C: a tamaño de etiqueta pequeña (1366) la C de Pixelify se distingue
  de la O (`docs/art/review/rc-fix-01/glyph-c-pixelify-vs-mono-1366.png`). Se
  mantiene Pixelify; la confusión solo aparece en tamaños medianos o en
  negrita y no se cambia la dirección tipográfica.

### D-079 · 2026-09-26 · Pasada visual desde el VISUAL MASTER PACK de ChatGPT

- Fuente de verdad visual: `SAVE_SLOT_02_CHATGPT_VISUAL_MASTER_PACK` (ZIP 1–3
  de 3). Prioridad: 01_PRIMARY_CANON > 03_UI_FLOW > 04_CHARACTERS >
  05_PROPS_ASSETS > 02_ATMOSPHERE_STYLE > 06_RUNTIME_REFERENCE. Sustituye, para
  esta pasada, la regla anterior de "sin arte de Claude": no se dibuja nada;
  todo píxel nuevo es un recorte del pack (`tools/art/pack_crops.py`,
  coordenadas documentadas en `docs/ASSETS.md`).
- Capa de compositing reutilizable `src/game/render/compositing.ts`: tinte de
  luz (multiply), oclusión hacia los pies, rim de 1 px del lado del sol,
  sombra proyectada con la silueta del propio sprite, sombra de contacto y
  grade (lavado + viñeta). Tres luces: `GOLDEN_HOUR` (La Muralla),
  `SEAFRONT_SUNSET` (reveal/fecha/final), `LAMPLIT_NIGHT` (DESYNC).
- La Muralla: CHAR-001 no se sustituye; se integra con la capa anterior. Luis
  y los NPC siguen siendo capa B (y-sort), ENV-001 capa A, grade capa D.
- Selección de clase: la build real era negra en la intro y navy plano después.
  Se reconstruye la presentación según `03_UI_FLOW/04_CLASS_SELECT_TARGET.png`
  (cabecera con skyline, carta PLAYER 1 con retrato, tres cartas ilustradas).
  Máquina de estados, textos de clase y guardado sin cambios.
- DESYNC: el fondo pasa a ser La Muralla de noche (ENV-001 con grade nocturno,
  como la variante NOCHE del canon 08); la arena es un panel navy translúcido.
  Mecánicas intactas.
- PLAYER 2: CHAR-003 = hoja de `04_MANU_SPRITE_SHEET_ART_TARGET` reducida a la
  rejilla de CHAR-001 (40×60, ancla 20,57, 55 px de figura); CHAR-004 = retrato
  de `09_MASTER_CONCEPT_SHEET`. El marcador de texto "MANU" desaparece. El slot
  02 sigue vacío hasta el beat del nombre (reconocimiento primero).
- Reveal, puerta cooperativa, elección de ruta, final y SAVE SLOT: fondo del
  paseo marítimo al atardecer (recorte limpio de `03_TITLE_ATMOSPHERE`, sin
  personajes). Las fechas usan las ilustraciones de DATE PORTALS del collage;
  solo imagen, sin texto de actividad nuevo. El final muestra la foto del
  malecón (panel FINAL SAVE CONFIRMATION, recortada sin Randy).
- Randy (perro) no entra: fue recortado del alcance y se excluye de todos los
  recortes. Sin GAME nuevo, sin cambios de jugabilidad, sin merge.

### D-080 · 2026-09-27 · RC-FIX-03: QA visual de la RC (director, 5851103987)

- Congelado: selección de clase, título, La Muralla (fondo + integración de
  CHAR-001), DESYNC, retrato/sprite de Manu, final, SAVE SLOT y CITY CARDS.
- Puerta cooperativa: solo presentación. El fondo del paseo queda arriba
  (cielo, bahía, Cimavilla); desde el horizonte, un plano de suelo navy con
  rejilla en perspectiva sustituye al panel opaco. La puerta gris pasa a ser
  un portal con dos mitades que se iluminan con cada señal y una columna de
  luz al abrirse; los interruptores son anillos en el suelo unidos al portal
  por líneas de señal; las etiquetas P1/P2 ya no quedan tapadas. Estados,
  controles y textos sin cambios.
- La Muralla: el defecto "LA M_URALLA" estaba horneado en ENV-001. Parche
  mínimo (`tools/art/patch_env_sign.py`): la caja de 40×25 px de la M se
  sustituye por los píxeles del canon `01_LA_MURALLA_MASTER_CINEMATIC`
  (mismo encuadre a escala 0,487), igualados en color. 1239 px cambiados,
  todos dentro de esa caja.
- Contrato de capas auditado recorriendo todas las posiciones alcanzables:
  la maceta junto al banco era un obstáculo accesible horneado sin oclusor
  (PLAYER 1 podía quedar detrás de su follaje). Se añade `occPot`, recortado
  de ENV-001 como los demás. Terraza, banco con lector, bici y arbustos
  desenfocados siguen en ENV porque los colliders impiden quedar detrás.
  FG-001: no necesario para esta RC.
- Fechas: las tarjetas de miércoles, jueves y domingo ya no muestran lugares
  (La Muralla, San Lorenzo, Santa Catalina); usan encuadres solo de cielo del
  atardecer aprobado. Se eliminan `date-wed/thu/sun.png`. El viernes conserva
  su candado y el texto `MISIÓN PRINCIPAL YA ACTIVA · 18:30 · TEATRO`
  (castellano, D-077). Lógica de selección intacta.
- Evidencia de La Muralla corregida: en el paquete anterior, `1920-muralla-a`
  y los AFTER de La Muralla eran capturas del título (el script capturaba
  antes de cambiar de escena). Los scripts de QA ahora esperan a la escena.

### D-081 · 2026-09-27 · RC-FIX-04: contrato de capas de La Muralla y FG-001

- El director comprobó en el HEAD que ENV-001 seguía horneando terraza,
  comensales, sombrillas, camarera, banco, bici, árbol y peatones, y que
  `foreground.png` era un placeholder sin usar. Corrige D-080 (que declaraba
  FG-001 innecesario).
- `tools/art/layers.py` divide ENV-001 con máscaras binarias, sin dibujar:
  - ENV `background.png`: fachada, interiores, suelo y luz.
  - WORLD (y-sort con PLAYER 1): `worldTerrace` (comensales, mesas, sillas,
    sombrillas, camarera, maceta de la escalera), `worldPlanters`,
    `worldTree` (tronco), `worldBench` (banco, lector y bici),
    `worldWalkerWest`/`worldWalkersEast`, más los `occ*` existentes.
  - FG-001 `foreground.png` (final): copa del árbol, hojas de arriba a la
    derecha y los arbustos desenfocados de abajo. Se dibuja sobre todo.
- Cada píxel pertenece a una sola capa. Donde dos oclusores se solapaban, el
  más cercano se queda el píxel (20 px del tablón pasan a la gaviota).
  `npm run art:check` comprueba que ENV + WORLD + FG-001 recomponen ENV-001
  píxel a píxel y que no hay solapes.
- Los huecos que deja WORLD/FG en ENV se rellenan con un promedio suave de su
  entorno. Nunca se ven en runtime (la capa siempre está encima). Es relleno
  técnico, no arte.
- CITY CARDS y el fondo nocturno de DESYNC usan la imagen aplanada
  `murallaFull.png` (idéntica a ENV-001); son ilustraciones, no la escena.
- Colisiones, posiciones, interacciones y aspecto final sin cambios. Solo
  cambia la profundidad donde antes era incorrecta: los arbustos cercanos ya
  tapan a Luis si se acerca.
- Fuente plana: `tools/art/source/env-001-full.png`. Orden de regeneración:
  `patch_env_sign.py` → `node tools/art/occluders.mjs` → `layers.py`.

