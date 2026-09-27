/**
 * Portrait system. A portrait is a pixel base (one char = one pixel) plus
 * one overlay per expression, stamped onto the base at `faceOrigin`.
 * Changing expression never changes the dialogue structure: lines only say
 * `expression: 'smug'`.
 */
export interface PortraitDefinition {
  id: string;
  palette: Readonly<Record<string, string>>;
  base: readonly string[];
  /** Top-left pixel where expression overlays are drawn. */
  faceOrigin: { x: number; y: number };
  /** Expression → overlay rows (`.` = keep the base pixel). Must include `neutral`. */
  expressions: Readonly<Record<string, readonly string[]>>;
}

export const DEFAULT_EXPRESSION = 'neutral';

/** Final pixel rows for a portrait + expression (unknown expressions → neutral). */
export function composePortrait(def: PortraitDefinition, expression?: string): string[] {
  const overlay =
    (expression !== undefined ? def.expressions[expression] : undefined) ??
    def.expressions[DEFAULT_EXPRESSION] ??
    [];
  const rows = def.base.map((row) => [...row]);
  overlay.forEach((line, dy) => {
    [...line].forEach((char, dx) => {
      const row = rows[def.faceOrigin.y + dy];
      const x = def.faceOrigin.x + dx;
      if (char !== '.' && row && x < row.length) row[x] = char;
    });
  });
  return rows.map((r) => r.join(''));
}
