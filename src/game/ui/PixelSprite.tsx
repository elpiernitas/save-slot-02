/**
 * Tiny pixel-art sprites described as text rows (one char = one pixel).
 * `.` is transparent; other chars map to colors in `palette`.
 * Rendered as crisp SVG rects, so they scale without blur at any size.
 */
export interface PixelSpriteProps {
  rows: readonly string[];
  palette: Readonly<Record<string, string>>;
  className?: string;
  title?: string;
}

export function PixelSprite({ rows, palette, className, title }: PixelSpriteProps) {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {rows.flatMap((row, y) =>
        [...row].map((char, x) =>
          char === '.' || !palette[char] ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[char]} />
          ),
        ),
      )}
    </svg>
  );
}
