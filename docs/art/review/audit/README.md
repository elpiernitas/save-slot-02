# Auditoría de producción — evidencia (PR #2, D-083 → D-086)

> **Estado final: código `fbc01a6`** (D-085 recalibración + D-086 guarda del
> menú de derrota). La sección «D-085 / D-086 — validación final» es la
> vigente; las secciones «Histórico» se conservan como referencia.

Capturas nuevas, solo de las escenas modificadas en esta ronda. Chromium
(Playwright), servidor de desarrollo salvo `prod-*` (build con
`--base=/save-slot-02/`). Código final: rama `claude/save-slot-02-game-00-5tw0pw`.

| Punto | Capturas |
| --- | --- |
| DESYNC PROCESS visible | `1920-boss-1-entry`, `1920-boss-2-fight`, `1920-boss-3-damaged`, `1920-boss-2b-signal-lost`, `1920-boss-4-terminated`, `1920-boss-5-collapsed`, `1366-boss-*` |
| Portal cerrado / abierto | `*-gate-1-await`, `1920-gate-2-p2walk`, `1920-gate-2b-p2ready`, `*-gate-3-open` |
| Reveal de Manu | `1920-reveal-1-slot`, `*-reveal-2-manu-portrait`, `*-reveal-2b-portrait-zoom` (recorte del mismo fotograma), `1920-reveal-3-line`, `*-reveal-4-coop-entry`, `prod-1920-reveal-2-manu-portrait` |
| Gaviota preparada / en picado | `*-18-seagull-ready`, `*-19-seagull-telegraph` |
| HUD sin tapar `LA MURALLA` | `1920-05-muralla-arrival`, `*-15-level-03-hud` |
| Ajustes `MOVIMIENTO REDUCIDO` | `*-02-title-settings` |
| Menú de derrota con flecha mantenida | `*-boss-defeat-menu-held-key` (`REINTENTAR`), `1920-boss-assist-menu-held-key` (`ACTIVAR`) |
| Ritmo (contenido nuevo) | `1920-14-beacons-round-2-pattern`, `*-22-terminal` |

## Histórico — matriz anterior a D-085 (código `eadf26c`)

`tools/qa/playthrough.mjs`: partida nueva hasta SAVE SLOT con teclado real
(Playwright), 6 recargas en checkpoints, comprobación de consola, scroll,
idioma y viernes. Bot rápido: conoce las soluciones y lee el estado de la
gaviota y del jefe por los hooks de QA de desarrollo.

| Resolución | Movimiento | Duración bot | Errores consola | Scroll | Líneas en inglés | Recargas (escena reanudada) | Viernes | Jefe |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1366×768 | reducido | 345 s | 0 | no | 0 | 6/6 correctas | bloqueado | 3 intentos |
| 1366×768 | normal | 271 s | 0 | no | 0 | 6/6 correctas | bloqueado | 1 intento |
| 1440×900 | reducido | 331 s | 0 | no | 0 | 6/6 correctas | bloqueado | 3 intentos |
| 1440×900 | normal | 311 s | 0 | no | 0 | 6/6 correctas | bloqueado | 2 intentos |
| 1920×1080 | reducido | 357 s | 0 | no | 0 | 6/6 correctas | bloqueado | 3 intentos |
| 1920×1080 | normal | 310 s | 0 | no | 0 | 6/6 correctas | bloqueado | 2 intentos |

Recargas: `overworld` ×3, `player2Reveal`, `ending`, `saveSlot`. Gaviota:
26 s en las 6. En 3 de las 6 el servidor de desarrollo registra 2 peticiones
de fuente Pixelify fallidas (solo dev; en producción 0).

Producción (`vite build --base=/save-slot-02/`, 1920, `tools/qa/prod-smoke.mjs`):
8 escenas sembradas (overworld, boss, reveal, dateGate, ending, guardado
corrupto, v1 heredado, sin almacenamiento) sin errores, sin peticiones
fallidas, sin hooks de QA y sin scroll.

## Histórico — partida a ritmo de lectura anterior a D-085

`tools/qa/playthrough-paced.mjs`, 1920×1080, movimiento normal:

- texto a velocidad **normal** (30 ms/carácter), sin saltar ninguna página:
  se espera a que termine de escribirse (`▼`);
- lectura de cada página nueva a 15 caracteres/s + 0,5 s (máx. 12 s);
- secuencias de balizas vistas completas;
- 1,5 s para localizar cada objeto antes de ir, 4 s para elegir clase,
  6 s para elegir fecha, 4 s + 1,5 s por pieza en el terminal.

| Total | Recargas de QA | **Neto** | Lectura | Pausas de decisión | Páginas leídas |
| --- | --- | --- | --- | --- | --- |
| 856 s | 16 s | **840 s (14,0 min)** | 441 s | 45,5 s | 62 |

Jefe: 2 intentos. Gaviota: 36 s. 0 errores, 0 líneas en inglés.

**Lo que esta medición no es:** no es una partida humana. El bot sigue
conociendo las soluciones, camina en línea recta sin explorar, y esquiva la
gaviota y el jefe leyendo su estado por los hooks de desarrollo. Todo ello
acorta el tiempo respecto a una primera partida real, así que 14 min es una
cota inferior aproximada, no la duración humana.

## D-085 / D-086 — validación final (código `fbc01a6`)

Evidencia en [`d085/`](d085/) (54 capturas, todas de `fbc01a6`). Scripts en
`tools/qa/`.

### Matriz de recorridos completos (`tools/qa/playthrough.mjs`)

Partida nueva hasta SAVE SLOT, incluida la recalibración obligatoria, con 7
recargas (`overworld` ×4 —una a mitad de la recalibración—, `player2Reveal`,
`ending`, `saveSlot`).

| Resolución | Movimiento | Bot | Consola | Scroll | Inglés | Recargas | Viernes | Recalibración | Gaviota | Jefe |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1366×768 | reducido | 373 s | 0 | no | 0 | 7/7 | bloqueado | guardada | guardada | 3 intentos |
| 1366×768 | normal | 312 s | 0 | no | 0 | 7/7 | bloqueado | guardada | guardada | 1 intento |
| 1440×900 | reducido | 399 s | 0 | no | 0 | 7/7 | bloqueado | guardada | guardada | 3 intentos |
| 1440×900 | normal | 307 s | 0 | no | 0 | 7/7 | bloqueado | guardada | guardada | 1 intento |
| 1920×1080 | reducido | 388 s | 0 | no | 0 | 7/7 | bloqueado | guardada | guardada | 3 intentos |
| 1920×1080 | normal | 414 s | 0 | no | 0 | 7/7 | bloqueado | guardada | guardada | 3 intentos |

En 5 de 6 el servidor de desarrollo registra 2 peticiones de fuente Pixelify
fallidas (solo dev; en producción 0).

**Fallos de herramienta distinguidos de fallos del juego** (todos
reejecutados de forma fiable):

- Marca «gaviota guardada» leída antes de que el panel se cerrara (1366/1440):
  el script ahora espera a que se cierre; el juego sí la guardaba (el terminal
  se abría después).
- Carrera al sembrar el guardado antes de que la app terminara de arrancar
  (`recal-flow`, 1366): el script ahora siembra tras el arranque.
- **Fallo real del juego** (1366 reducido, antes de D-086): una flecha nueva
  pulsada en el instante de la derrota abría el menú en `VOLVER AL TÍTULO`.
  Corregido en D-086 y repetida toda la validación.

### Casos de persistencia (`tools/qa/recal-flow.mjs`, 1366 / 1440 / 1920)

| Caso | Resultado en las tres |
| --- | --- |
| Partida nueva: terminal → recalibración obligatoria → jefe | pasa (matriz: recalibración guardada antes del jefe en 6/6) |
| Recalibración pendiente: CONTINUAR → La Muralla, 6 casillas | `overworld`, 0/6 |
| Recarga con 2/6 sincronizadas | vuelve a la recalibración pendiente y **reinicia la ronda (0/6)**: el progreso parcial no se guarda |
| Completarla → jefe | `boss`, `route.recalibration` guardado |
| Guardado antiguo con `boss.attempts > 0` sin recalibración | `boss` (la salta) |
| Recalibración ya completada | `boss` (no se repite) |
| Caso límite: terminal hecho, última escena el jefe, 0 intentos (anterior a esta versión) | `boss` |

### HUD apilado

`*-recal-hud-terrace`, `*-recal-hud-door12` (cámara desplazada a la derecha),
`*-level-02-calibrating-hud`, `*-level-04-recalibrating-hud`,
`*-newgame-level-03-hud`: la pila empieza bajo el rótulo `LA MURALLA` y no
tapa a Luis ni las marcas de las balizas. Con la cámara a la derecha, la
etiqueta de ubicación `LA MURALLA TARDE` (anterior y congelada) sigue
cubriendo parte del inicio del rótulo.

### Menú de derrota / asistencia (`tools/qa/boss-held-key.mjs`)

| Resolución | Flecha mantenida al perder | Flecha nueva al perder | Pulsación 0,5 s después |
| --- | --- | --- | --- |
| 1366 / 1440 / 1920 | `REINTENTAR` | `ACTIVAR` (ignorada) | `AHORA NO` (navega) |

Sin la guarda (`MENU_GUARD_MS = 0`) la flecha nueva movía el cursor.

### Producción (`tools/qa/prod-smoke.mjs`, `--base=/save-slot-02/`, 1920)

9 escenas sembradas (overworld, recalibración pendiente → overworld, jefe,
reveal, dateGate, ending, guardado corrupto, v1 heredado, sin
almacenamiento): 0 errores, 0 peticiones fallidas, sin hooks de QA, sin
scroll.

### Duración a ritmo de lectura (`tools/qa/playthrough-paced.mjs`, 1920, normal)

Condiciones idénticas a la medición histórica (texto normal sin saltos,
lectura a 15 car./s + 0,5 s por página, secuencias vistas enteras, pausas de
decisión). Sigue sin ser una partida humana: el bot conoce las soluciones y
esquiva por los hooks de desarrollo.

| Medición | Código | Neto | Terminal → jefe | Jefe | Intentos del jefe |
| --- | --- | --- | --- | --- | --- |
| Anterior | `0cfa6ab` (sin recalibración) | **840 s** (14,0 min) | 14 s | 128 s | 2 |
| Con recalibración | `c0c264a` | **987,5 s** (16,5 min) | 151 s | 174 s | 3 |
| Con recalibración (final) | `fbc01a6` | **1007,0 s** (16,8 min) | 149 s | 149 s | 3 |

Desglose de los +147 s netos: ≈ **+134 s** atribuibles a la recalibración
(tramo terminal → jefe, descontando ≈ 3 s de una recarga de QA); ≈ **+46 s**
por el tercer intento del jefe en esa partida; ≈ −33 s de variación en el
resto (p. ej. gaviota 36 → 25 s).

Segunda medición, sobre el código final `fbc01a6`: 1007,0 s netos (1025,1 s
totales − 18,1 s de recargas de QA; 541 s de lectura, 78 páginas). Terminal →
jefe 149 s (≈ **+132 s** de recalibración frente a los 14 s sin ella,
descontando ≈ 3 s de recarga); jefe 149 s con 3 intentos (≈ +21 s frente a los
128 s con 2). 0 errores, 0 líneas en inglés, viernes bloqueado.

**Resumen:** la recalibración añade ≈ 130 s a una partida a ritmo de lectura.
Las dos mediciones con recalibración dan 16,5 y 16,8 min netos. No es una
duración humana medida.
