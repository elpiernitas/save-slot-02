import type { TextSpeed } from '../state/types';
import type { MarkupToken, TextStyle } from './markup';

/**
 * Typewriter timing, pure and centralised. A page becomes a list of glyphs,
 * each with the time (ms from page start) at which it appears.
 */

/** Milliseconds per character for each player setting. */
export const TEXT_SPEED_DELAY_MS: Readonly<Record<TextSpeed, number>> = {
  slow: 55,
  normal: 30,
  fast: 14,
  instant: 0,
};

/** How much punctuation pauses and [pause] tags are kept at each speed. */
export const PAUSE_SCALE: Readonly<Record<TextSpeed, number>> = {
  slow: 1.2,
  normal: 1,
  fast: 0.5,
  instant: 0,
};

/** Extra wait after punctuation (before scaling). Short on purpose. */
export const SENTENCE_PAUSE_MS = 220; // . ! ? …
export const CLAUSE_PAUSE_MS = 90; // , ; :

const SENTENCE_END = new Set(['.', '!', '?', '…']);
const CLAUSE_END = new Set([',', ';', ':']);
const PUNCTUATION = new Set([...SENTENCE_END, ...CLAUSE_END, '¡', '¿', '"', '»', ')']);

export interface Glyph {
  char: string;
  style: TextStyle;
  /** Reveal time in ms since the page started. */
  at: number;
  /** True for a line break glyph (renders as <br>). */
  isBreak: boolean;
}

export interface Timeline {
  glyphs: Glyph[];
  /** Time at which the last glyph appears. */
  totalMs: number;
}

const BREAK_STYLE: TextStyle = { em: false, shake: false, sys: false, pace: 1 };

export function buildTimeline(
  tokens: readonly MarkupToken[],
  speed: TextSpeed,
  delayMultiplier = 1,
): Timeline {
  const perChar = TEXT_SPEED_DELAY_MS[speed] * delayMultiplier;
  const pauseScale = PAUSE_SCALE[speed];
  const glyphs: Glyph[] = [];
  let t = 0;

  // Flatten to a char stream first so punctuation can look ahead.
  type Item =
    | { kind: 'char'; char: string; style: TextStyle }
    | { kind: 'pause'; ms: number }
    | { kind: 'break' };
  const items: Item[] = [];
  for (const token of tokens) {
    if (token.type === 'text') {
      for (const char of token.text) items.push({ kind: 'char', char, style: token.style });
    } else if (token.type === 'pause') {
      items.push({ kind: 'pause', ms: token.ms });
    } else {
      items.push({ kind: 'break' });
    }
  }

  items.forEach((item, index) => {
    if (item.kind === 'pause') {
      t += item.ms * pauseScale;
      return;
    }
    if (item.kind === 'break') {
      glyphs.push({ char: '\n', style: BREAK_STYLE, at: t, isBreak: true });
      return;
    }
    t += item.char === ' ' ? perChar * 0.5 * item.style.pace : perChar * item.style.pace;
    glyphs.push({ char: item.char, style: item.style, at: t, isBreak: false });

    const next = items[index + 1];
    const nextChar = next?.kind === 'char' ? next.char : null;
    const isLastVisible = !items.slice(index + 1).some((i) => i.kind === 'char');
    // Only pause at the end of a punctuation run ("..." or "?!" pause once),
    // and never after the final character (the ▼ should appear right away).
    if (isLastVisible || (nextChar !== null && PUNCTUATION.has(nextChar))) return;
    if (SENTENCE_END.has(item.char)) t += SENTENCE_PAUSE_MS * pauseScale;
    else if (CLAUSE_END.has(item.char)) t += CLAUSE_PAUSE_MS * pauseScale;
  });

  return { glyphs, totalMs: t };
}

/** Number of glyphs visible `elapsedMs` after the page started. */
export function visibleGlyphCount(timeline: Timeline, elapsedMs: number): number {
  let count = 0;
  for (const glyph of timeline.glyphs) {
    if (glyph.at > elapsedMs) break;
    count++;
  }
  return count;
}

// ---- Voice blips --------------------------------------------------------

/** Minimum gap between two blips: avoids a "machine gun" at fast speeds. */
export const BLIP_MIN_INTERVAL_MS = 65;

/** Letters and digits speak; spaces, punctuation and breaks are silent. */
export function isVoicedChar(char: string): boolean {
  return /[\p{L}\p{N}]/u.test(char);
}

/**
 * Should a blip play now? `newGlyphs` are the glyphs revealed since the last
 * frame; one blip at most per frame and per BLIP_MIN_INTERVAL_MS.
 */
export function shouldBlip(
  newGlyphs: readonly Glyph[],
  nowMs: number,
  lastBlipMs: number | null,
): boolean {
  if (!newGlyphs.some((g) => !g.isBreak && isVoicedChar(g.char))) return false;
  return lastBlipMs === null || nowMs - lastBlipMs >= BLIP_MIN_INTERVAL_MS;
}

// ---- Confirm handling ---------------------------------------------------

/** Ignore a second confirm this soon after the previous one (key bounce, double click). */
export const CONFIRM_COOLDOWN_MS = 140;

export type ConfirmAction = 'reveal' | 'advance' | 'ignore';

/**
 * One press = one action. While typing, confirm reveals the page; once the
 * page is complete, confirm advances. Held keys and double clicks never skip
 * an unread page.
 */
export function resolveConfirm({
  typingDone,
  repeat,
  msSinceLastAction,
}: {
  typingDone: boolean;
  repeat: boolean;
  msSinceLastAction: number;
}): ConfirmAction {
  if (repeat || msSinceLastAction < CONFIRM_COOLDOWN_MS) return 'ignore';
  return typingDone ? 'advance' : 'reveal';
}
