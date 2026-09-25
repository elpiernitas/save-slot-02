import type { CSSProperties } from 'react';
import type { Glyph } from '../typewriter';

/**
 * Renders glyphs as plain text spans (never HTML). Every glyph is laid out
 * from the start and unrevealed ones are only hidden, so words never jump
 * to the next line while typing. Screen readers get the full page at once.
 */
export function DialogueText({
  glyphs,
  visible,
  plain,
}: {
  glyphs: readonly Glyph[];
  visible: number;
  plain: string;
}) {
  return (
    <>
      <p className="dlg-text" aria-hidden="true">
        {glyphs.map((glyph, i) => {
          if (glyph.isBreak) return <br key={i} />;
          const { em, sys, shake } = glyph.style;
          const className = [em && 'dlg-em', sys && 'dlg-sys', shake && 'dlg-shake']
            .filter(Boolean)
            .join(' ');
          return (
            <span
              key={i}
              className={className || undefined}
              data-hidden={i >= visible || undefined}
              style={shake ? ({ '--shake-i': i % 3 } as CSSProperties) : undefined}
            >
              {glyph.char}
            </span>
          );
        })}
      </p>
      <p className="visually-hidden" aria-live="polite">
        {plain}
      </p>
    </>
  );
}
