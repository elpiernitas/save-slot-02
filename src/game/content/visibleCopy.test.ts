import { describe, expect, it } from 'vitest';

/**
 * Static guard for D-077 (player-facing language = Spanish). Every string
 * literal and JSX text in shipped source is checked for English UI/system
 * vocabulary. Code ids are lowercase/camelCase and never match; accepted
 * labels (PLAYER 1/2, SAVE SLOT 02, CITY CARDS, LA MURALLA, MANU, DESYNC,
 * CHECKSUM, HOLO, key names) are removed before checking.
 */
/** Every source file as text (Vite raw import; no Node APIs needed). */
const SOURCES = import.meta.glob<string>('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
/** Dev-only content and files that are never player-facing. */
const SKIP = [/\.test\.tsx?$/, /content\/dialogue\/demo\.ts$/, /\.d\.ts$/];
const ALLOWED = [
  'PLAYER 1',
  'PLAYER 2',
  'SAVE SLOT 02',
  'CITY CARDS',
  'CITY CARD',
  'LA MURALLA',
  'MANU',
  'LUIS',
  'DESYNC',
  'CHECKSUM',
  'HOLO',
  'ENTER',
  'ESC',
  'WASD',
];
/** Exact strings that are code, not copy (DOM tag names). */
const CODE_TOKENS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const ENGLISH =
  /\b(THE|YOU|YOUR|SIDE QUEST|MAIN QUEST|THEATRE|UPDATED|COMPLETE|DATE ROUTE|EXPIRED|ELAPSED|INCOMPATIBLE|RETURN|TITLE|SIGNAL|FOUND|READY|SELECT|CONTINUE|SETTINGS|LOADING|BACK|RETRY|ENABLE|NOT NOW|ASSIST|INPUT|SYNC|SYNCED|STATUS|CLASS|FULLSCREEN|WINDOW|KEYBOARD|INTERACT|MOVE|PAUSE|NEW|OBTAINED|HINT|BEACON|SERVICE|ACCESS|RECOVER\w*|MISSING|CHANNEL|STABLE|SPLIT|LOST|TERMINATED|SCANNING|IDENTITY|LINK|PARTY|REQUIRED|DESTINATION|YES|SAVING|LOCK\w*|WED|THU|FRI|SUN|SEPTEMBER|OCTOBER|MISMATCH|NODE|ROUTE|QUEST|PLAYERS|PROCESS|ERROR DETECTED)\b/;

/** String literals and JSX text, outside comments and console calls. */
function visibleCandidates(source: string): string[] {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line) && !/console\.\w+\(/.test(line))
    .join('\n');
  const out: string[] = [];
  for (const m of code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`|>([^<>{}\n]+)</g)) {
    const text = m[1] ?? m[2] ?? m[3] ?? m[4] ?? '';
    if (/[A-Z]{3,}/.test(text)) out.push(text);
  }
  return out;
}

describe('player-facing copy (D-077)', () => {
  it('has no English UI/system vocabulary outside the accepted labels', () => {
    const offenders: string[] = [];
    for (const [path, source] of Object.entries(SOURCES)) {
      if (SKIP.some((re) => re.test(path))) continue;
      for (const text of visibleCandidates(source)) {
        if (CODE_TOKENS.has(text)) continue;
        let rest = text;
        for (const label of ALLOWED) rest = rest.split(label).join(' ');
        if (ENGLISH.test(rest)) offenders.push(`${path}: ${text}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
