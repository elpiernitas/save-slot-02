# SAVE SLOT 02 — World Bible

> Fuente de verdad **creativa** del universo desde GAME-04. La
> [`GAME_CONSTITUTION.md`](GAME_CONSTITUTION.md) guarda las reglas de alto
> nivel (tono, límites, fechas, dispositivo); este documento guarda los
> detalles del mundo. Si chocan, gana la constitución y se actualiza aquí.
>
> Los ejemplos de este documento son **dirección**, no contenido final: no se
> convierten en escenas o diálogos sin decidirlo en su fase.

## 1. La idea

**Gijón cotidiano, ligeramente ficcionado y gamificado.**

> Cosas completamente normales tratadas con lógica de RPG.

Luis debe reconocer lugares, situaciones y pequeños detalles, pero el juego
cuenta una **misión nueva**. No es una recreación cronológica de cómo se
conocieron, ni una colección de recuerdos, ni un álbum sentimental.

SAVE SLOT 02 **no** es:

- un juego exclusivamente nocturno;
- un RPG oscuro o gótico;
- una recreación cronológica de una relación;
- una experiencia basada en tarot;
- una parodia de Pokémon.

## 2. Tono

- Aventura urbana.
- Humor seco y absurdo.
- Ligera rareza: el mundo es casi normal, y ese "casi" es el juego.
- Cotidianeidad convertida en videojuego (misiones, objetos, NPCs, menús).
- Misterio en pequeñas dosis.
- Emoción sutil; nunca empalagosa ni "gran romance cinematográfico".

**Regla del anticlímax:** el mundo puede parecer que prepara una misión
épica y después pedir algo absolutamente cotidiano. _Ejemplo conceptual:_
"ir a buscar provisiones" puede acabar significando comprar sidra.

## 3. Gijón

Reconocible, **no** cartográficamente exacto. Se simplifica, se comprime y
se reordena lo que haga falta para el juego.

Lugares de referencia actuales:

| Lugar                       | Uso previsto (orientativo)                     |
| --------------------------- | ---------------------------------------------- |
| La Muralla (bar/café)       | la terraza del slice de GAME-04 (tarde)        |
| Cimavilla                   | barrio con cuestas, terrazas, vida de tarde    |
| Cuesta del Cholo            | punto de encuentro de tarde                    |
| Paseo / costa / San Lorenzo | atardecer, mar, momento tranquilo              |
| Zonas comerciales           | planes absurdamente normales (mañana)          |
| Cine                        | plan de tarde/noche                            |
| Bares / terrazas            | tarde y noche                                  |
| Zonas de fiesta             | noche                                          |
| Hoyo 13                     | referencia **secundaria**, nunca punto central |

Planes reales que marcan el tono (inspiración, no guion):

- quedar de tarde;
- estar con amigos;
- ir a un almacén mayorista a comprar sidra al por mayor;
- comer en una tienda gigante de muebles;
- ir al cine;
- tomar algo después con amigos.

**Marcas:** Makro, IKEA y otros nombres comerciales **no** tienen por qué
aparecer tal cual. Preferir equivalentes ficcionados y reconocibles (nombre
parecido, logotipo inventado, arquitectura típica) para que el mundo no
parezca publicidad ni copia literal.

## 4. Franjas del día

La ciudad **no** está siempre de noche. Las franjas son herramientas
visuales y narrativas; la historia no tiene por qué ocurrir en un único día.

| Franja    | Sensación                 | Escenarios típicos                               |
| --------- | ------------------------- | ------------------------------------------------ |
| Mañana    | limpia, cotidiana, ligera | zonas comerciales, recados absurdamente normales |
| Tarde     | ciudad viva               | terrazas, Cimavilla, Cuesta del Cholo, amigos    |
| Atardecer | tranquila                 | costa, paseo, mar                                |
| Noche     | luces, movimiento         | bares, fiesta, pequeños elementos extraños       |

El arranque del sistema (system check, boot, título) puede seguir siendo
oscuro: es la "consola" antes de entrar al mundo.

## 5. Estilo visual

**"Pixel art moderno, pero no demasiado retro."** Un RPG portátil antiguo
reinterpretado por un indie actual.

Sí:

- sprites reconocibles;
- fondos con bastante detalle;
- iluminación contemporánea, reflejos, sombras;
- agua/mar con movimiento sutil, vegetación;
- carteles y arquitectura simplificados;
- animaciones pequeñas.

No:

- estética Game Boy de 4 colores;
- resolución deliberadamente ilegible;
- filtros CRT exagerados, scanlines constantes, exceso de glitch;
- nostalgia falsa por nostalgia.

**Resolución y escala (cerrado en GAME-04, D-049):**

- **Mundo explorable: 640×360** lógicos (16:9). Tiles de 16 px; personajes
  de mapa de **32×48 px** (D-056). Así un encuadre muestra un tramo de calle
  entero (fachada, terraza, árbol) y el personaje se lee bien.
- Arte del mundo: **PNG raster** generado offline y commiteado (D-055); el
  renderer solo blitea imágenes.
- **UI** (cajas, menús, textos): sigue en su rejilla de 480×270 (`--px`),
  independiente del mundo.
- En portátiles 1366×768 el personaje mide ≈102 px en pantalla (antes ≈51
  con 16×24). No hace falta zoom de cámara.

**Referencias de arte:** `docs/ART_DIRECTION_V1.md` (concepto aprobado,
north star; no se recorta ni se usa como textura). El primer slice es
`La Muralla · tarde` (GAME-04): **La Muralla es el bar/café** (no una
muralla) y su terraza en una calle peatonal de Cimavilla (D-054).

## 6. Paleta

No limitar el juego a negro/morado. Base del mundo (tokens `--world-*` en
`src/styles/tokens.css`):

| Token           | Color (orientativo) | Uso                                  |
| --------------- | ------------------- | ------------------------------------ |
| `--world-navy`  | azul marino         | mar, noche, sombras frías            |
| `--world-coast` | verde costero       | vegetación, costa, detalles          |
| `--world-cream` | crema               | fachadas, luz de mañana, texto claro |
| `--world-stone` | gris piedra         | piedra, muralla, suelo urbano        |
| `--world-coral` | rojo/coral          | acentos, tejados, señales            |
| `--world-warm`  | amarillo cálido     | sol de tarde, farolas, luces         |

La paleta **cambia con la franja horaria** (mañana más fría y clara, tarde
cálida, atardecer coral, noche marina con luces cálidas). Los valores se
afinarán con los primeros fondos en GAME-04.

## 7. Personajes

Los assets definitivos (sprites y retratos) se crearán **más adelante, a
partir de referencias visuales que proporcionará Manu**. Hasta entonces no
se inventan retratos ni sprites definitivos de Luis, Manu ni Randy; se usan
siluetas genéricas, sigilos e iconos propios.

### Luis — PLAYER 1

- Pelo oscuro.
- Look canon futuro: camiseta blanca de manga larga con un corazón negro en
  el centro.
- **Sin clase asignada de antemano:** la elige él (GUERRERO, TANQUE o
  CURADOR; ver `src/game/player/classes.ts`). El juego no asume cuál "le
  pega".

### Manu — PLAYER 2

- Aparece **bastante más tarde** (GAME-07). No se introduce antes.
- Look canon futuro: sudadera negra, gafas negras.

### Randy

- Golden retriever. Personaje secundario / easter egg, reconocible.
- **No** es una mascota mágica elegida ni pieza central de la trama.
- Puede aparecer en una zona, ayudar con algo pequeño o simplemente existir.

### Personajes de desarrollo

El **Archivero** (monitor CRT) fue la demo del motor de diálogo de GAME-02.
**No es canon** y no se reutiliza automáticamente.

## 8. Clases

Surgieron de una conversación real entre los jugadores: **GUERRERO, TANQUE,
CURADOR**. Solo estas tres (nada de mago, pícaro, oráculo…).

Filosofía: las clases **no crean tres juegos distintos**. Cambian, de forma
manejable, pequeños diálogos, opciones contextuales, flavor text, alguna
solución alternativa, reacciones de NPCs y pequeñas rutas en puzzles. El
contenido principal siempre es accesible con cualquier clase.

| Clase    | Núcleo                                     | Humor                                               |
| -------- | ------------------------------------------ | --------------------------------------------------- |
| GUERRERO | frontal; actúa; empuja la situación        | poca paciencia con los rodeos                       |
| TANQUE   | aguanta; protege; persevera                | todo se soluciona sobreviviendo el tiempo necesario |
| CURADOR  | observa; ayuda; arregla; mantiene al grupo | acaba cuidando problemas que nadie le pidió         |

Sin clichés exagerados ni estadísticas numéricas por ahora. Para variar
contenido: condición `{ kind: 'playerClass', classId }` en diálogos y
helper `hasPlayerClass(save, id)`.

## 9. Tarot

Luis sabe leer cartas; la primera vez que se vieron apareció, entre otras,
una referencia importante al **Tres de Espadas invertido**.

Decisión:

- el tarot **no** es tema central;
- **no** hay clase de tarotista/oráculo;
- el juego **no** se estructura alrededor de cartas del tarot;
- puede aparecer más adelante como **easter egg puntual y sutil**;
- nunca se presenta como predicción real.

## 10. Música

Existe una playlist compartida muy variada (urbano, latin, pop alternativo,
indie, rock en español, salsa/merengue, 80s/90s/2000s, electrónica rara).
Sirve **solo como referencia estética privada**.

- Nada de audio comercial, melodías copiadas ni pistas descargadas.
- La OST será **original** (GAME-11) y podrá cambiar por zona/franja:

| Contexto            | Dirección                        |
| ------------------- | -------------------------------- |
| Día                 | cálido, guitarras, groove ligero |
| Tarde               | indie, nostálgico                |
| Comercial / absurdo | funky, juguetón                  |
| Noche               | bajo, electrónica, percusión     |
| Misterio            | texturas suaves y extrañas       |
| Final               | sencillo, cálido                 |

## 11. Qué no se construye todavía

Hecho en GAME-04: un único vertical slice (la calle del bar La Muralla,
Cimavilla, tarde) con PLAYER 1 provisional (sin likeness final) y una
camarera genérica. Siguen pendientes: el resto de Gijón, otras franjas
horarias, sprites y retratos finales de Luis/Manu/Randy (según referencias de
Manu), Randy en el mundo, la OST y cualquier localización comercial.
