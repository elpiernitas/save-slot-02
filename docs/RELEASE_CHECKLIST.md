# RELEASE CHECKLIST — SAVE SLOT 02

Release date target: 2026-09-28.

## Blockers
- [x] GAME-04R visual ACCEPT
- [x] complete core story path
- [x] date selection works
- [x] ending persists
- [x] npm run check
- [ ] CI green
- [ ] production deploy
- [ ] incognito smoke

## Before merge
- [ ] review PR diff
- [x] no temporary secrets
- [x] no broken/corrupt runtime assets
- [x] no debug handles
- [x] no placeholder player-facing strings
- [x] no unapproved paid integrations
- [x] no commercial music/assets
- [ ] repo private

## Production
- [ ] Netlify build success
- [ ] headers verified
- [ ] robots verified
- [x] no console errors
- [x] no failed network requests
- [x] localStorage save works
- [ ] fullscreen fallback
- [x] audio mute
- [x] 1366×768

## Final owner check
Only ask Manu for:
- visual ACCEPT if still pending;
- final production link/send decision.

Do not burden Manu with technical checklist execution unless necessary.

## Estado RC (GAME-12, 2026-09-26)

Verificado en local (Chromium 1920/1440/1366, build de producción con
`vite preview` y recorrido completo en el servidor de desarrollo):

- [x] `npm ci` limpio (0 vulnerabilidades) + `npm run check`
- [x] recorrido completo de partida nueva: título → clase → La Muralla →
      cartas → ruta → terminal → DESYNC → reveal → date gate → final → slot
- [x] refresh en La Muralla, tras el puzzle, tras el jefe, tras la fecha y en
      el slot
- [x] teclado (todo el recorrido) + ratón (date gate, slot, menús)
- [x] reduced motion (recorrido completo a 1366)
- [x] sin scroll, consola limpia, sin peticiones fallidas en producción
- [x] PLAYER 2 no aparece antes del reveal (arrival, terminal, jefe)
- [x] fechas y viernes exactos; fecha y final persistentes e idempotentes
- [x] save corrupto → backup + partida nueva; v1 → v2; sin localStorage → juega
- [x] móvil → pantalla INCOMPATIBLE DISPLAY
- [x] `noindex` (meta + `X-Robots-Tag`) y `robots.txt` presentes
- [x] filtro de idioma: 0 textos en inglés visibles en el recorrido completo
      (D-077)

Pendiente fuera del alcance de Claude (requiere a Manu):
- [ ] CI verde en el commit RC (se comprueba tras el push)
- [ ] merge y deploy en Netlify, headers y smoke en incógnito en producción
- [ ] Safari/Firefox reales (en este entorno solo hay Chromium)
