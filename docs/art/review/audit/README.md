# Auditoría de producción — evidencia (PR #2, D-083)

Capturas nuevas, solo de las escenas modificadas en esta ronda. Chromium
(Playwright), servidor de desarrollo salvo `prod-*` (build con
`--base=/save-slot-02/`). Código final: rama `claude/save-slot-02-game-00-5tw0pw`.

| Punto | Capturas |
| --- | --- |
| DESYNC PROCESS visible | `1920-boss-1-entry`, `1920-boss-2-fight`, `1920-boss-3-damaged`, `1920-boss-2b-signal-lost`, `1920-boss-4-terminated`, `1920-boss-5-collapsed`, `1366-boss-*` |
| Portal cerrado / abierto | `*-gate-1-await`, `1920-gate-2-p2walk`, `1920-gate-2b-p2ready`, `*-gate-3-open` |
| Reveal de Manu | `1920-reveal-1-slot`, `*-reveal-2-manu-portrait`, `1920-reveal-2b-portrait-zoom`, `1920-reveal-3-line`, `*-reveal-4-coop-entry`, `prod-1920-reveal-2-manu-portrait` |
| Gaviota preparada / en picado | `*-18-seagull-ready`, `*-19-seagull-telegraph` |
| HUD sin tapar `LA MURALLA` | `1920-05-muralla-arrival`, `*-15-level-03-hud` |
| Ajustes `MOVIMIENTO REDUCIDO` | `*-02-title-settings` |
| Ritmo (contenido nuevo) | `1920-14-beacons-round-2-pattern`, `*-22-terminal` |

## Recorrido completo automatizado (medido)

Bot con teclado real (Playwright `keyboard`), texto instantáneo, sin leer.
Incluye recargas en 6 checkpoints, comprobación de scroll y de idioma.

| Resolución | Movimiento | Duración bot | Intentos jefe | Gaviota | Errores consola | Líneas en inglés |
| --- | --- | --- | --- | --- | --- | --- |
| 1920×1080 | reducido | 256 s | 1 | 26 s | 0 | 0 |
| 1440×900 | reducido | 332 s | 3 (2 fallos) | 28 s | 0 | 0 |
| 1366×768 | reducido | 348 s | 3 (2 fallos) | 28 s | 0 | 0 |
| 1920×1080 | normal (código final) | 373 s | 3 (2 fallos) | 26 s | 0 | 0 |

Recargas: `overworld` ×3, `player2Reveal`, `ending`, `saveSlot` — todas
reanudan en la escena esperada. Viernes bloqueado (no abre confirmación).

Producción (`vite build --base=/save-slot-02/`, 1920): 8 escenas sembradas
(overworld, boss, reveal, dateGate, ending, guardado corrupto, v1 heredado,
sin almacenamiento) sin errores, sin peticiones fallidas, sin hooks de QA
y sin scroll. El retrato de Manu carga (230×283) también en producción.

**Limitación:** la duración humana de 20–30 min no está medida. El bot
no lee diálogos, conoce las soluciones y usa texto instantáneo; el tiempo
humano será mayor, pero no hay dato que lo demuestre.
