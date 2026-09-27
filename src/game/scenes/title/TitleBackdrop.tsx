import { PixelSprite } from '../../ui/PixelSprite';

/** Deterministic star field (no randomness: identical on every load). */
const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 137.5) % 100,
  y: ((i * 61.8) % 58) + 2,
  size: i % 7 === 0 ? 2 : 1,
  delay: (i % 9) * 0.37,
  slow: i % 3 === 0,
}));

/** Original pixel-art "save crystal". One char = one pixel. */
const CRYSTAL = [
  '.....a.....',
  '....aab....',
  '...aawbb...',
  '..aawwbbb..',
  '.aaawbbbbc.',
  'aaaabbbbccc',
  '.aaabbbccc.',
  '..aabbccc..',
  '...abbcc...',
  '....bcc....',
  '.....c.....',
];
const CRYSTAL_PALETTE = {
  w: '#f4efff',
  a: '#b9a2ff',
  b: '#8f6bff',
  c: '#4b35a3',
};

/** Distant pixel horizon: flat ruins/hills silhouette. */
const HORIZON = [
  '..............xx..............................x......................xxx..........................',
  '.............xxxx.......x....................xxx...........x........xxxxx.................x.......',
  'x..........xxxxxxxx....xxx.......xx.........xxxxx.........xxx......xxxxxxx......xx.......xxx......x',
  'xxx......xxxxxxxxxxxx.xxxxx....xxxxxx....xxxxxxxxxx....xxxxxxx...xxxxxxxxxxx..xxxxxx...xxxxxxx..xxx',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
];

export function TitleBackdrop() {
  return (
    <div className="title-backdrop" aria-hidden="true">
      {STARS.map((star, i) => (
        <span
          key={i}
          className={`title-star${star.slow ? ' title-star--slow' : ''}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `calc(var(--px) * ${star.size})`,
            height: `calc(var(--px) * ${star.size})`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
      <PixelSprite className="title-crystal" rows={CRYSTAL} palette={CRYSTAL_PALETTE} />
      <PixelSprite className="title-horizon" rows={HORIZON} palette={{ x: '#120f1f' }} />
    </div>
  );
}
