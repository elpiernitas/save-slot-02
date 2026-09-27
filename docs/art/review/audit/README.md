# Auditoría de producción — evidencia (PR #2, D-083)

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

## Matriz de recorridos completos (código `eadf26c`)

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

## Partida a ritmo de lectura (medida)

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
