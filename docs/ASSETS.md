# Assets y licencias

Registro de todo asset de terceros incluido en el juego. Si no está aquí, no
entra en el repositorio. Nada de IP protegida (Pokémon, Nintendo, etc.).

## Fuentes

| Asset         | Archivos                                                                                  | Origen                                                                                                                       | Licencia                                                                               |
| ------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Pixelify Sans | `src/assets/fonts/pixelify-sans/pixelify-sans-latin-{400,700}-normal.woff2` (≈7,7 KB c/u) | Proyecto Pixelify Sans (https://github.com/eifetx/Pixelify-Sans), obtenido del paquete npm `@fontsource/pixelify-sans@5.3.0` | SIL Open Font License 1.1 — texto completo en `src/assets/fonts/pixelify-sans/OFL.txt` |

Notas:

- Solo el subset **latin** (incluye acentos y ñ del español), pesos 400 y 700.
- La OFL permite usar, embeber y redistribuir la fuente dentro del juego;
  no permite venderla por separado. El archivo de licencia viaja con ella.

## Gráficos

**VISUAL MASTER PACK (D-079).** Arte de ChatGPT aportado por Manu como fuente
de verdad visual. `src/assets/pack/` contiene solo recortes (y la hoja de Manu
reducida) generados por `python3 tools/art/pack_crops.py <carpeta del pack>`:

| Archivo | Origen (pack) | Uso |
| --- | --- | --- |
| `seafront.png` | 02_ATMOSPHERE_STYLE/03_TITLE_ATMOSPHERE (0,500)-(712,941) | Fondo de reveal, puerta, fecha, final, SAVE SLOT |
| `polaroid.png` | 03_UI_FLOW/02_GAME_FLOW_COLLAGE panel 4, sin Randy | Foto del final y del SAVE SLOT |
| `date-fri.png` | 02_GAME_FLOW_COLLAGE panel 3 (DATE PORTALS, viernes) | Carta del viernes (candado); las demás fechas usan solo el cielo de `seafront.png` (D-080) |
| `class-player1/warrior/tank/healer/sky.png` | 03_UI_FLOW/04_CLASS_SELECT_TARGET | Selección de clase |
| `manu.png` | 04_CHARACTERS/04_MANU_SPRITE_SHEET_ART_TARGET → 120×240 (40×60) | CHAR-003, sprite de Manu |
| `manu-portrait.png` | 01_PRIMARY_CANON/09_MASTER_CONCEPT_SHEET | CHAR-004, retrato del reveal |

ENV-001 (`background.png`) lleva un parche mínimo en la M del rótulo con
píxeles del canon (`tools/art/patch_env_sign.py`, D-080). `occPot.png` es un
oclusor más recortado de ENV-001 (`tools/art/occluders.mjs`).

Iluminación de sprites en runtime: `src/game/render/compositing.ts` (no genera
arte, solo luz/sombra/grade sobre los sprites aprobados).

**Estado actual de La Muralla (D-066, D-068).** Lo que describe el resto de
esta sección de mundo es el generador de placeholders, que ya no es el arte
en uso:

- `background.png` = ENV-001 de ChatGPT (960×400), final.
- `occ*.png`: oclusores recortados de ENV-001 (`tools/art/occluders.mjs`).
- `player.png` = CHAR-001 de ChatGPT (final); `playerLarge.png` = CHAR-001 ×2
  exacto (`tools/art/scale-player.mjs`), proxy hasta un CHAR-001 nativo.
- GAME-06: símbolos de baliza CUP/LAMP/BIRD y tiles del SYNC TERMINAL son
  glifos SVG de UI (`BeaconIcon.tsx`, `SyncTerminal.tsx`), no arte de escena.
- GAME-07: la arena de DESYNC PROCESS y la sala del gate son geometría de
  sistema en canvas (rejilla, nodos, contornos) sobre fondos del mundo
  (D-079). Manu: CHAR-003 y CHAR-004 salen del VISUAL MASTER PACK.
- CITY CARDS (GAME-05): sus ilustraciones son ventanas sobre ENV-001
  (`art` en `src/game/content/cards.ts`); no hay archivos de arte nuevos.

Todo original, dibujado en código:

- Cristal del título, horizonte y estrellas: `src/game/scenes/title/TitleBackdrop.tsx`
  (matrices de píxeles propias).
- Indicador ▼: CSS (`clip-path`), sin glifo de fuente.
- **Mundo (GAME-04, revisión visual; D-054–D-056)**: PNG originales en
  `src/assets/world/muralla/`, generados por `npm run art` (`tools/art/`) de
  forma determinista y verificados por `npm run art:check`. Nada calcado de
  fotos ni de Street View; rótulos inventados con fuentes pixel propias.
  - `background.png` (800×416): fachadas (edificio ocre con persiana
    "MERCERIA" y nota "VUELVO EN 5 MIN", bar "LA MURALLA" en madera verde con
    escaparates cálidos, edificio coral con portal nº 7 y frutería), mirador
    blanco, balcones, acera, adoquín de granito, canaleta, rejillas, bordillo
    y sombras horneadas (luz de tarde desde el oeste).
  - `player.png` / `waitress.png`: hojas 96×192 (frames 32×48, 4 direcciones
    × 3 frames). PLAYER 1 **provisional** (pelo oscuro con raya al medio,
    camiseta blanca de manga larga con corazón negro, vaqueros; sin likeness
    final). Camarera genérica, no canon.
  - Props: `tree` (2 frames), `tableSet` (mesa, 4 sillas, sombrilla beige
    abierta), `tableSetFolded` (sombrilla plegada), `windbreakWest`/`East`/
    `Side` (cortavientos de cristal), `board` (pizarra), `bollard`,
    `bollardMarked`, `bench`, `bin`, `gull` (2 frames), `pot`.
- Referencia (no asset de producción): `docs/art/visual-concept-v1.jpg` +
  `docs/ART_DIRECTION_V1.md`, aportados por Manu. No se recortan ni se usan
  como textura. Nota: el JPEG del repo está truncado (ver DECISION_LOG D-053).

## Audio

Todo generado por síntesis (osciladores Web Audio), sin archivos:
`src/game/audio/synthSfx.ts`.
