import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/useGame';
import { achievementDefinition } from './registry';
import './achievements.css';

const TOAST_MS = 2500;

/** Non-blocking, single-line reward feedback. It never owns gameplay input. */
export function AchievementToast() {
  const { save } = useGame();
  const seen = useRef(new Set(Object.keys(save.achievements)));
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const next = Object.keys(save.achievements).find((candidate) => !seen.current.has(candidate));
    if (!next) return;
    seen.current.add(next);
    setId(next);
    const timeout = window.setTimeout(() => setId(null), TOAST_MS);
    return () => window.clearTimeout(timeout);
  }, [save.achievements]);

  const achievement = id ? achievementDefinition(id) : undefined;
  if (!achievement) return null;
  return (
    <aside className="achievement-toast" role="status" aria-live="polite">
      <span className="achievement-toast__eyebrow">LOGRO DESBLOQUEADO</span>
      <strong>{achievement.title}</strong>
      <span>{achievement.description}</span>
    </aside>
  );
}
