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

**Estado actual de La Muralla (D-066, D-068).** Lo que describe el resto de
esta sección de mundo es el generador de placeholders, que ya no es el arte
en uso:

- `background.png` = ENV-001 de ChatGPT (960×400), final.
- `occ*.png`: oclusores recortados de ENV-001 (`tools/art/occluders.mjs`).
- `player.png` = CHAR-001 de ChatGPT (final); `playerLarge.png` = CHAR-001 ×2
  exacto (`tools/art/scale-player.mjs`), proxy hasta un CHAR-001 nativo.
- GAME-06: símbolos de baliza CUP/LAMP/BIRD y tiles del SYNC TERMINAL son
  glifos SVG de UI (`BeaconIcon.tsx`, `SyncTerminal.tsx`), no arte de escena.
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
