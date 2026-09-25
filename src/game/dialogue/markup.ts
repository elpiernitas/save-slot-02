/**
 * Tiny, safe dialogue markup. Parsed into tokens; never into HTML.
 *
 *   [em]word[/em]        emphasis (highlight colour)
 *   [shake]word[/shake]  per-letter shake (static with reduced motion)
 *   [sys]text[/sys]      system tone (terminal green)
 *   [slow]…[/slow]       type slower (×2 delay)   [fast]…[/fast] faster (×0.5)
 *   [pause]              deliberate pause (350 ms)   [pause=800] custom, 50–2000 ms
 *   \n                   line break inside the page
 *   [[                   a literal "["
 *
 * Styles may nest ([em][shake]¿Qué?[/shake][/em]). Anything else in brackets
 * is reported as an error and rendered literally, so a typo can never inject
 * markup or hide text.
 */

export interface TextStyle {
  em: boolean;
  shake: boolean;
  sys: boolean;
  /** Delay multiplier from [slow]/[fast]; 1 = normal. */
  pace: number;
}

export type MarkupToken =
  | { type: 'text'; text: string; style: TextStyle }
  | { type: 'pause'; ms: number }
  | { type: 'break' };

export interface MarkupResult {
  tokens: MarkupToken[];
  errors: string[];
}

export const DEFAULT_PAUSE_MS = 350;
export const MIN_PAUSE_MS = 50;
export const MAX_PAUSE_MS = 2000;

type StyleTag = 'em' | 'shake' | 'sys' | 'slow' | 'fast';
const STYLE_TAGS: readonly StyleTag[] = ['em', 'shake', 'sys', 'slow', 'fast'];
const PACE: Record<'slow' | 'fast', number> = { slow: 2, fast: 0.5 };

function styleFromStack(stack: readonly StyleTag[]): TextStyle {
  let pace = 1;
  for (const tag of stack) if (tag === 'slow' || tag === 'fast') pace *= PACE[tag];
  return {
    em: stack.includes('em'),
    shake: stack.includes('shake'),
    sys: stack.includes('sys'),
    pace,
  };
}

export function parseMarkup(source: string): MarkupResult {
  const tokens: MarkupToken[] = [];
  const errors: string[] = [];
  const stack: StyleTag[] = [];
  let buffer = '';

  const flush = () => {
    if (!buffer) return;
    const style = styleFromStack(stack);
    const last = tokens[tokens.length - 1];
    if (last?.type === 'text' && sameStyle(last.style, style)) last.text += buffer;
    else tokens.push({ type: 'text', text: buffer, style });
    buffer = '';
  };

  let i = 0;
  while (i < source.length) {
    const char = source[i]!;
    if (char === '\n') {
      flush();
      tokens.push({ type: 'break' });
      i++;
      continue;
    }
    if (char !== '[') {
      buffer += char;
      i++;
      continue;
    }
    if (source[i + 1] === '[') {
      buffer += '[';
      i += 2;
      continue;
    }
    const end = source.indexOf(']', i);
    const raw = end === -1 ? null : source.slice(i + 1, end);
    const handled = raw !== null && handleTag(raw);
    if (!handled) {
      errors.push(`Unknown or invalid tag "${source.slice(i, end === -1 ? undefined : end + 1)}"`);
      buffer += char; // render literally
      i++;
      continue;
    }
    i = end + 1;
  }
  flush();
  for (const open of stack) errors.push(`Unclosed tag [${open}]`);
  return { tokens, errors };

  function handleTag(raw: string): boolean {
    const pause = /^pause(?:=(\d+))?$/.exec(raw);
    if (pause) {
      const ms = pause[1] === undefined ? DEFAULT_PAUSE_MS : Number(pause[1]);
      if (ms < MIN_PAUSE_MS || ms > MAX_PAUSE_MS) return false;
      flush();
      tokens.push({ type: 'pause', ms });
      return true;
    }
    const closing = raw.startsWith('/');
    const name = (closing ? raw.slice(1) : raw) as StyleTag;
    if (!STYLE_TAGS.includes(name)) return false;
    flush();
    if (!closing) {
      stack.push(name);
      return true;
    }
    if (stack[stack.length - 1] !== name) {
      errors.push(`Mismatched closing tag [/${name}]`);
      return true; // swallow the stray closer; the text stays intact
    }
    stack.pop();
    return true;
  }
}

function sameStyle(a: TextStyle, b: TextStyle): boolean {
  return a.em === b.em && a.shake === b.shake && a.sys === b.sys && a.pace === b.pace;
}

/** Visible text without markup (for validation, screen readers, logs). */
export function plainText(source: string): string {
  return parseMarkup(source)
    .tokens.map((t) => (t.type === 'text' ? t.text : t.type === 'break' ? '\n' : ''))
    .join('');
}
