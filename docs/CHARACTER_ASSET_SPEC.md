# SAVE SLOT 02 — Character Asset Specification

Status: production target for sprite/portrait preparation.

## Shared rules

Overworld:
- modern pixel art;
- readable silhouette;
- no giant heads/chibi exaggeration unless all characters use it;
- feet/ground anchor consistent;
- 4-direction movement;
- idle + two walk frames minimum.

Portraits:
- more detailed than overworld;
- same hair/outfit identity;
- warm lighting consistent with current scene where practical;
- transparent or easily masked background.

## Luis / PLAYER 1

### Overworld target

Preferred frame:
- 32×48 minimum;
- 36×54 or 40×60 acceptable after QA.

Canon:
- dark hair;
- centre-part/curtain shape;
- white long-sleeve shirt;
- black heart centered on chest;
- blue/dark denim;
- black/white contemporary sneakers;
- slim build.

Directions:
- down;
- up;
- right;
- left.

Frames per direction:
- idle;
- step A;
- step B.

Collision:
- lower-body/feet footprint only.

### Portrait target

Expressions:
- neutral;
- slight smile;
- amused;
- confused/suspicious;
- surprised;
- annoyed/flat.

Do not require glasses.

## Manu / PLAYER 2

### Overworld target

Canon:
- dark voluminous hair;
- black rectangular glasses;
- black hoodie;
- white layer showing at collar/hem;
- dark/blue trousers;
- contemporary sneakers.

Do not introduce in GAME-04R narrative.

### Portrait target

Expressions:
- neutral;
- playful;
- surprised;
- confused;
- smug/teasing;
- warm smile.

## Randy

Light/cream golden retriever.

Overworld states:
- stand;
- walk A/B;
- sit;
- attentive;
- sleep.

Randy should be recognisable as a normal golden retriever and not stylised
into a magical familiar.

## Functional NPC — waitress/server

GAME-04R only needs:
- neutral readable sprite;
- idle;
- optional one simple gesture.

No elaborate portrait required until the dialogue presentation needs it.

## Sprite sheet conventions

Preferred layout:
- rows = directions/states;
- columns = animation frames;
- transparent PNG;
- no spacing between frames unless manifest defines it;
- consistent logical frame dimensions.

Manifest must define:
- frameWidth;
- frameHeight;
- row mapping;
- anchor;
- collision;
- animation timing.

## QA

At 1366×768 desktop:
- Luis's heart motif should still read;
- hair silhouette should be distinct;
- player must be easy to locate immediately;
- sprite should not look tiny compared with terrace chairs/tables.

If the heart disappears completely or player reads as generic 16-bit filler,
the sprite is too small or too low-detail.
