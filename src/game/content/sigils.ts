/**
 * Original pixel sigils for the classes and a generic player silhouette.
 * Abstract on purpose: no swords/shields/medical crosses, and NOT the final
 * look of Luis (final sprites come from Manu's references, WORLD_BIBLE §7).
 * One char = one pixel; `.` is transparent.
 */
export interface PixelArt {
  rows: readonly string[];
  palette: Readonly<Record<string, string>>;
}

/** GUERRERO: a double chevron pushing forward. */
const WARRIOR: PixelArt = {
  palette: { x: '#ef7a5f', d: '#a8453a' },
  rows: [
    '............',
    '.xx....xx...',
    '..xx....xx..',
    '...xx....xx.',
    '....xx....xx',
    '....dd....dd',
    '...dd....dd.',
    '..dd....dd..',
    '.dd....dd...',
    '............',
  ],
};

/** TANQUE: a wall that does not move. */
const TANK: PixelArt = {
  palette: { x: '#9aa7b4', d: '#55606d' },
  rows: [
    '............',
    '.xxxxdxxxxx.',
    '.xxxxdxxxxx.',
    '.dddddddddd.',
    '.xxdxxxxdxx.',
    '.xxdxxxxdxx.',
    '.dddddddddd.',
    '.xxxxdxxxxx.',
    '.xxxxdxxxxx.',
    '............',
  ],
};

/** CURADOR: a sprout that keeps growing. */
const HEALER: PixelArt = {
  palette: { x: '#7fd6a0', d: '#3d8c63', s: '#b58a5a' },
  rows: [
    '............',
    '......xx....',
    '.....xxxx...',
    '.xx..xxxx...',
    'xxxx..xx....',
    'xxxxx.d.....',
    '.xxxx.d.....',
    '......d.....',
    '....sssss...',
    '...sssssss..',
  ],
};

export const SIGILS: Readonly<Record<string, PixelArt>> = {
  warrior: WARRIOR,
  tank: TANK,
  healer: HEALER,
};

/** Generic, faceless player figure (placeholder, not Luis). */
export const PLAYER_SILHOUETTE: PixelArt = {
  palette: { f: '#e9e2cf', s: '#b9b2a0' },
  rows: [
    '....ffff....',
    '...ffffff...',
    '...ffffff...',
    '....ffff....',
    '.....ss.....',
    '..ffffffff..',
    '.ffffffffff.',
    '.ff.ffff.ff.',
    '.ff.ffff.ff.',
    '.ss.ffff.ss.',
    '....ssss....',
    '....ffff....',
    '....f..f....',
    '....f..f....',
    '....f..f....',
    '...ff..ff...',
  ],
};
