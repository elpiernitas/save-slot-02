import { CHARACTER_ROWS, SPRITES, SPRITE_URLS } from '../world/art/assets';

/**
 * PLAYER 1 (CHAR-001) and PLAYER 2 side by side. PLAYER 2 has no approved
 * sprite yet (CHAR-003), so he stays a labelled system marker — no figure.
 */
export function Party({ facing = 'down' }: { facing?: 'down' | 'up' }) {
  const info = SPRITES.player;
  const url = SPRITE_URLS.player;
  return (
    <div className="date-gate__party ending__party" aria-hidden="true">
      {info && url && (
        <span
          className="date-gate__p1"
          style={{
            backgroundImage: `url(${url})`,
            backgroundPosition: `0 calc(var(--px) * ${-CHARACTER_ROWS[facing] * info.frameHeight})`,
            backgroundSize: `calc(var(--px) * ${info.width}) calc(var(--px) * ${info.height})`,
            width: `calc(var(--px) * ${info.frameWidth})`,
            height: `calc(var(--px) * ${info.frameHeight})`,
          }}
        />
      )}
      <span className="date-gate__p2">MANU</span>
    </div>
  );
}
