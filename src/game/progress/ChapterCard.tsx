import { useEffect, useLayoutEffect, useRef } from 'react';
import { INPUT_PRIORITY } from '../input/inputRouter';
import { useInput } from '../input/useInput';
import { useGame } from '../state/useGame';
import { LEVELS, levelLabel, type Level } from './chapters';
import './chapters.css';

/** How long a title card stays (ENTER skips). */
export const CARD_MS = 2600;

/**
 * Chapter title card: NIVEL 0N, the title, the goal, and seven pips. Owns
 * input while shown (the world stays paused). `alert` adds the red system
 * line used before the final boss.
 */
export function ChapterCard({
  level,
  heading,
  alert,
  onDone,
}: {
  level: Level;
  /** Replaces the title (e.g. `JEFE FINAL: DESYNC PROCESS`). */
  heading?: string;
  alert?: string;
  onDone: () => void;
}) {
  const { services } = useGame();
  const done = useRef(onDone);
  const fired = useRef(false);
  useLayoutEffect(() => {
    done.current = onDone;
  });
  const finish = () => {
    if (fired.current) return;
    fired.current = true;
    done.current();
  };
  useEffect(() => {
    services.audio.playSfx(alert ? 'warning' : 'confirm');
    const id = window.setTimeout(finish, alert ? CARD_MS + 900 : CARD_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useInput(
    (input, { repeat }) => {
      if (input === 'confirm' && !repeat) finish();
    },
    { priority: INPUT_PRIORITY.panel },
  );
  return (
    <div
      className="chapter-card"
      role="status"
      onClick={finish}
      data-alert={alert ? '' : undefined}
    >
      <div className="chapter-card__band">
        {alert && <p className="chapter-card__alert">{alert}</p>}
        <p className="chapter-card__level">{levelLabel(level.n)}</p>
        <h2 className="chapter-card__title">{heading ?? level.title}</h2>
        <p className="chapter-card__goal">{level.objective}</p>
        <Pips current={level.n} />
      </div>
    </div>
  );
}

export function Pips({ current }: { current: number }) {
  return (
    <span className="chapter-pips" aria-hidden="true">
      {LEVELS.map((l) => (
        <i key={l.n} data-state={l.n < current ? 'done' : l.n === current ? 'now' : undefined} />
      ))}
    </span>
  );
}

/**
 * Persistent status line: NIVEL 0N · TITLE, pips, and the current goal.
 * `compact` drops the goal line while the route HUD below states the task,
 * so the stack stays short and clear of the world's beacon marks.
 */
export function ChapterHud({ level, compact = false }: { level: Level; compact?: boolean }) {
  return (
    <div
      className="chapter-hud"
      data-compact={compact || undefined}
      aria-label={`${levelLabel(level.n)}: ${level.title}${compact ? `. ${level.objective}` : ''}`}
    >
      <p className="chapter-hud__head">
        <span className="chapter-hud__level">{levelLabel(level.n)}</span>
        <span>{level.title}</span>
        <Pips current={level.n} />
      </p>
      {!compact && <p className="chapter-hud__goal">{level.objective}</p>}
    </div>
  );
}
