# GAME-11 — Final Polish Checklist

## Visual
- [ ] no programmer-art screen in normal flow
- [ ] no broken concept refs
- [ ] Luis consistent
- [ ] Manu consistent after reveal
- [ ] UI navy/cream grammar consistent
- [ ] no body scroll
- [ ] no unreadable tiny player
- [ ] dialogue placement safe
- [ ] selected/disabled states clear
- [ ] GAME-04R debt (D-068): native CHAR-001 at 80×120 per frame (240×480
      sheet, same design/rows) replaces the ×2 proxy `playerLarge`, if
      ChatGPT delivers it
- [ ] GAME-04R debt (D-068): corrected ENV-001 without the blurred centre
      repair strip and with clean "LA MURALLA" lettering, same 960×400
      composition, if ChatGPT delivers it (then re-run
      `node tools/art/occluders.mjs`)

## Motion
- [ ] scene transitions consistent
- [ ] reduced motion
- [ ] no endless distracting animation
- [ ] no input during transition

## Audio
- [ ] unlock gesture
- [ ] music routes
- [ ] mute
- [ ] voice blips
- [ ] SFX levels
- [ ] no node leaks
- [ ] no autoplay console errors

## Content
- [ ] SYSTEM language consistent
- [ ] dialogue Spanish
- [ ] no Wrapped/trivia drift
- [ ] no accidental romance monologue
- [ ] date copy canonical
- [ ] Friday correct
- [ ] no third-party copied assets

## Code
- [ ] no prod debug handle
- [ ] no TODO in player path
- [ ] no unsupported effects used in shipped content
- [ ] no console warnings
- [ ] npm run check

## Save
- [ ] new game
- [ ] refresh
- [ ] corrupt save backup
- [ ] completed save
- [ ] settings persist
- [ ] date persists
