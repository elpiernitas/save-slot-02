import { useEffect, useRef } from 'react';
import { loadImage, MANU_SPRITE } from '../art/pack';
import { createLitCache, drawLitCharacter, SEAFRONT_SUNSET } from '../render/compositing';
import { CHARACTER_ROWS, loadSpriteImages, SPRITES } from '../world/art/assets';

/** Canvas size in logical px (1 sprite px = 1 stage px, as CHAR-001 elsewhere). */
const W = 100;
const H = 66;

/**
 * PLAYER 1 (CHAR-001) and PLAYER 2 (Manu, master-pack sprite) side by side,
 * drawn through the compositing layer so both carry the seafront's light,
 * cast shadow and contact shadow instead of floating over the backdrop.
 */
export function Party({ facing = 'down' }: { facing?: 'down' | 'up' }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([loadSpriteImages(['player']), loadImage(MANU_SPRITE.url)]).then(
      ([sprites, manu]) => {
        const canvas = ref.current;
        const luis = sprites.get('player');
        const info = SPRITES.player;
        if (!alive || !canvas || !luis || !info) return;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, W, H);
        ctx.imageSmoothingEnabled = false;
        const light = createLitCache(SEAFRONT_SUNSET);
        const row = CHARACTER_ROWS[facing];
        const cast = [
          { id: 'player', img: luis as CanvasImageSource, s: info, x: 32 },
          { id: 'manu', img: manu as CanvasImageSource, s: MANU_SPRITE, x: 68 },
        ];
        for (const c of cast) {
          drawLitCharacter(
            ctx,
            light,
            c.id,
            { img: c.img, sx: 0, sy: row * c.s.frameHeight, w: c.s.frameWidth, h: c.s.frameHeight },
            { x: c.s.anchorX, y: c.s.anchorY },
            c.x,
            H - 6,
          );
        }
      },
      (error: unknown) => console.error('Party art failed to load', error),
    );
    return () => {
      alive = false;
    };
  }, [facing]);

  return (
    <div className="date-gate__party ending__party" aria-hidden="true">
      <canvas ref={ref} className="party__canvas" width={W} height={H} />
    </div>
  );
}
