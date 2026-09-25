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

Todo original, dibujado en código:

- Cristal del título, horizonte y estrellas: `src/game/scenes/title/TitleBackdrop.tsx`
  (matrices de píxeles propias).
- Indicador ▼: CSS (`clip-path`), sin glifo de fuente.
- **Mundo (GAME-04)**, todo generado por código y determinista:
  - Personajes de mapa 16×24 (`src/game/world/art/characters.ts`): PLAYER 1
    **provisional** (pelo oscuro con raya al medio, camiseta blanca de manga
    larga con corazón negro; sin likeness final) y una camarera genérica no
    canon. 4 direcciones × 3 frames (idle + 2 pasos).
  - Props (`src/game/world/art/props.ts`): bolardos, mesas con sillas,
    sombrillas, farola, cartel (letras abstractas, sin rótulos reales),
    jardineras, banco, gaviota (2 frames) y árbol procedural (2 frames).
  - Suelo, muralla, puerta, fachada del café, calle y sombras
    (`src/game/world/render/canvasRenderer.ts`): pintado procedural con ruido
    determinista (`hash2`).
- Referencia (no asset de producción): `docs/art/visual-concept-v1.jpg` +
  `docs/ART_DIRECTION_V1.md`, aportados por Manu. No se recortan ni se usan
  como textura. Nota: el JPEG del repo está truncado (ver DECISION_LOG D-053).

## Audio

Todo generado por síntesis (osciladores Web Audio), sin archivos:
`src/game/audio/synthSfx.ts`.
