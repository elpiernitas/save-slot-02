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
