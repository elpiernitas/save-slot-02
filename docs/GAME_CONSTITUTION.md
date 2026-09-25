# SAVE SLOT 02 — Constitución del juego

> Fuente de verdad del proyecto. Si otro documento o el código contradicen
> esto, gana este archivo (o se actualiza aquí primero, con entrada en
> `DECISION_LOG.md`).
>
> Los detalles del universo (Gijón, franjas del día, estilo visual, paleta,
> personajes, clases, tarot, música) viven en
> [`WORLD_BIBLE.md`](WORLD_BIBLE.md). Aquí solo quedan las reglas de alto
> nivel.

## 1. Qué es

Un videojuego web **corto, real y jugable**, hecho por Manu para una única
persona: Luis. Nombre provisional: **SAVE SLOT 02**.

No es: una landing page, un cuestionario, un "Wrapped", una felicitación
interactiva, una presentación ni una simulación superficial de videojuego.

## 2. Visión

Debe sentirse como un pequeño **RPG indie portátil** hecho expresamente para
un jugador.

Lenguaje visual de referencia (sensación, nunca copia):

- RPG de Game Boy Advance / Nintendo DS
- aventuras pixel-art
- cajas de diálogo clásicas con indicador ▼
- menús RPG, inventario, decisiones, secretos, progresión
- humor autorreferencial

**El mundo** (desde GAME-03, D-040): un **Gijón cotidiano, ligeramente
ficcionado y gamificado** — cosas completamente normales tratadas con lógica
de RPG. Luis reconoce lugares y detalles, pero vive una **misión nueva**.
Detalle en [`WORLD_BIBLE.md`](WORLD_BIBLE.md).

## 3. Tono

**Sí:** humor, sorpresa, ironía, pequeños momentos absurdos, referencias
internas, cierto misterio, progresión, una parte emocional **sutil**.

**No:** cursi, empalagoso, infantil, tarjeta romántica, encuesta,
presentación, Wrapped, landing de San Valentín, recreación cronológica de
"cómo se conocieron", colección de recuerdos, RPG oscuro/gótico, juego
exclusivamente nocturno, parodia de Pokémon.

**Regla narrativa clave:** la cita final es un **plot twist / recompensa**, no
el propósito evidente desde el principio. Nada en las primeras escenas debe
delatarlo.

## 4. Fechas (zona horaria: `Europe/Madrid`)

| Qué                    | Fecha                 | Estado en el juego                                                                     |
| ---------------------- | --------------------- | -------------------------------------------------------------------------------------- |
| Envío del juego        | lunes 28 sep 2026     | `LAUNCH_DATE`                                                                          |
| Opción de cita         | miércoles 30 sep 2026 | seleccionable                                                                          |
| Opción de cita         | jueves 1 oct 2026     | seleccionable                                                                          |
| Plan real ya existente | viernes 2 oct 2026    | **MAIN QUEST ALREADY ACTIVE**, NO seleccionable (teatro 18:30, posible fiesta después) |
| Opción de cita         | domingo 4 oct 2026    | seleccionable                                                                          |

- Todas las fechas viven en `src/game/calendar/calendar.ts`. **Nunca** se
  escriben fechas u horas a mano en componentes.
- Todo "ahora" viene de un `Clock` inyectado (testeable, permite viajar en el
  tiempo en debug).
- Las reglas se evalúan siempre en hora de Madrid, esté donde esté el
  dispositivo.

## 5. Dispositivo objetivo

> Sustituye a la versión mobile-first de GAME-00 (ver DECISION_LOG D-017).

- **Prioridad: ordenador** (portátil o sobremesa), navegador moderno, teclado,
  pantalla horizontal, preferiblemente en **pantalla completa**.
- A Luis se le pedirá explícitamente jugar desde un ordenador.
- Escenario de juego **16:9** que ocupa el máximo espacio disponible, con
  letterbox negro cuando la ventana no es 16:9. Resolución lógica provisional
  **480×270**.
- Controles: **teclado primero** (flechas / WASD, Enter / Espacio, Escape) y
  ratón como alternativa en menús. El táctil no es un objetivo.
- **Móvil no jugable:** en pantallas claramente inadecuadas (dispositivo solo
  táctil con pantalla pequeña) aparece una pantalla diegética
  `INCOMPATIBLE DISPLAY` antes de cargar el juego.
- **Ventana de escritorio demasiado pequeña** (< 800×450 CSS px): pantalla
  `WINDOW TOO SMALL`; el juego continúa solo en cuanto la ventana crece.
- La compatibilidad móvil se conserva técnicamente donde no molesta (safe
  areas, `100dvh`), pero **no condiciona el diseño**.
- Fullscreen: se ofrece en el primer gesto; nunca es obligatorio ni atrapa al
  jugador (Escape siempre sale, y el juego sigue en ventana).

## 6. Jugador (contexto para fases posteriores)

> Solo inspiración para easter eggs y mecánicas. **No** se usa todo; en
> GAME-00 no se usa nada. Cada referencia que entre al juego debe ser original
> en su ejecución (sin IP de terceros).

- Muy aficionado a los videojuegos (~1.400 juegos en Steam, dato aproximado).
- Juega online con amigos; usa Discord.
- Colección antigua de cartas Pokémon (inspiración para un sistema de cartas
  **propio**, nunca cartas/arte de Pokémon).
- Minecraft, Clash Royale; ha hablado de jugar 2v2.
- Conoce bien la cultura Nintendo (p. ej. reconoce a Birdo).
- Entiende al instante roles RPG: guerrero, tanque, curador.
- Usa referencias de videojuegos en conversaciones normales.
- Nostalgia de Club Penguin.
- Le gustan Spider-Man y Doctor Strange; le gusta el cine.
- Recomendó "Los cronocrímenes".
- Le atraen ocultismo, magia, tarot y similares (sin necesariamente creer).

Las referencias a IP ajenas se hacen como **guiño** (texto, humor, alusión),
nunca con sprites, logos, música, sonidos o personajes protegidos.

Decisiones tomadas sobre este perfil (detalle en `WORLD_BIBLE.md`): las
clases son GUERRERO / TANQUE / CURADOR y **las elige Luis**; el tarot **no**
es tema central (como mucho, easter egg sutil); la playlist compartida es
solo referencia estética privada (nada de audio comercial).

## 7. Reglas creativas

1. Todo asset es original o con licencia compatible documentada.
2. Prohibido: sprites/música/sonidos/logos/fuentes/tilesets de Pokémon,
   Nintendo o cualquier propiedad protegida.
3. Humor antes que ternura. La emoción se gana, no se declara.
4. Cada pantalla debe parecer parte de un videojuego, no de una web.
5. Corto y denso: mejor 20 minutos memorables que una hora de relleno.
6. Nada de datos personales innecesarios: solo lo imprescindible dentro del
   contenido del juego, nunca en metadatos públicos.

## 7b. Idioma y diálogo

- **Dos capas de idioma, a propósito:**
  - **SYSTEM / UI** en inglés retro: SYSTEM, SAVE, CONTINUE, SETTINGS,
    QUEST, pantallas de arranque… No se traduce lo existente.
  - **Diálogo de personajes y narrador** principalmente en **español**.
- La caja de diálogo es la de un RPG portátil (tercio inferior, borde pixel
  doble, pestaña con el nombre, retrato opcional, ▼), original: no se copia
  ninguna UI concreta.
- Cada página cabe entera en la caja (máx. 3 líneas cortas); nunca hay
  scroll. Los scripts se validan en tests.
- La expresividad se consigue con el markup mínimo (`[em]`, `[shake]`,
  `[sys]`, `[slow]`, `[fast]`, `[pause]`), nunca con HTML.
- La demo de GAME-02 (`dialogueDemo`, el Archivero) **no es contenido
  final** y no revela nada de la historia.

## 8. Dirección artística (provisional)

- Píxel perfecto cuando tenga sentido; `image-rendering: pixelated`.
- Bordes nítidos, sombras duras, sin blur ni degradados decorativos.
- Cajas RPG, interfaz retro, tipografía pixel **Pixelify Sans** (SIL OFL,
  autoalojada; ver DECISION_LOG D-021 y `docs/ASSETS.md`).
- **Pixel art moderno, pero no demasiado retro**: sprites reconocibles,
  fondos detallados, iluminación contemporánea; nada de 4 colores, CRT
  exagerado ni scanlines constantes (WORLD_BIBLE §5).
- El **arranque del sistema** puede seguir oscuro; el **mundo** usa una paleta
  costera (marino, verde, crema, piedra, coral, amarillo) que cambia con la
  franja del día (WORLD_BIBLE §4–6). Animaciones discretas.
- Assets definitivos de Luis, Manu y Randy: se crearán a partir de
  referencias visuales de Manu; hasta entonces, siluetas y sigilos propios.
- Evitar: glassmorphism, degradados decorativos, estética SaaS, botones
  redondeados, emojis en la UI, componentes tipo app móvil.
- Buen contraste. Transiciones rápidas.
- Nada de "web corporativa".
- Tokens en `src/styles/tokens.css`. La paleta **no** está cerrada.

## 9. Accesibilidad y UX (requisitos)

- **Teclado completo** para todas las acciones principales; ratón como
  alternativa en menús.
- Selección / foco siempre visible (cursor `>` + inversión de color).
- Contraste suficiente en todo el texto.
- Respetar `prefers-reduced-motion` (animaciones decorativas y transiciones
  desactivadas o instantáneas).
- Fullscreen nunca obligatorio: si el navegador no lo permite o el jugador lo
  rechaza, se explica y se continúa en ventana, con opción de reintentar.
- Escape nunca rompe el estado del juego (salir de fullscreen o volver atrás en
  un menú son acciones seguras).
- Sin scroll ni selección de texto durante el juego; cursor normal en menús
  (ocultarlo por inactividad queda como posible mejora futura).
- El audio se puede mutear siempre, y nunca suena antes de una interacción.

## 10. Hosting

- **Netlify** (build `npm run build`, publica `dist/`). Configurado en
  `netlify.toml`. Sin despliegue hasta GAME-12 (o cuando Manu lo pida).
- El sitio no se indexa (`noindex` en meta, cabecera y `robots.txt`).

## 11. Seguridad y privacidad

- Sin login, sin backend, sin analítica (por ahora).
- Sin secretos, API keys, conversaciones completas ni datos sensibles en el
  repositorio.
- Sin nombres reales en `<title>`, meta tags ni cualquier metadato público.
- El repositorio debe permanecer **privado** (contiene este documento).
- `docs/` no se despliega: solo se publica `dist/`.

## 12. Límites técnicos (principios)

- Stack: React + TypeScript + Vite + CSS propio. Sin frameworks UI pesados,
  sin Tailwind.
- **Exploración: motor propio ligero** (Canvas 2D + lógica pura), decidido en
  GAME-04 frente a Phaser (D-048). Es un subsistema: **React es dueño del
  save, los diálogos, las quests y la UI**; el motor solo guarda estado
  efímero (posición, animación) y comunica por callbacks. Un solo motor.
- **Arte del mundo: PNG raster** commiteados (`src/assets/world/`); el
  renderer solo blitea imágenes. Hoy se generan con `npm run art` (D-055) y
  pueden sustituirse por PNG dibujados a mano con el mismo nombre y ancla.
- Persistencia inicial: `localStorage` detrás de una capa propia; sustituible
  por Supabase sin rehacer el juego.
- No sobrearquitectar: cada sistema se construye en la fase que lo necesita.
- Todo lo que sea lógica (fechas, guardado, condiciones, reducer) es puro y
  tiene tests.
