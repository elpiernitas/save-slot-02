import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/useGame';
import { achievementDefinition } from './registry';
import './achievements.css';

const SHOW_MS = 2800;

/**
 * Watches the save for newly unlocked achievements and shows one small toast
 * each. Achievements already in the save when the page loads stay quiet.
 */
export function AchievementToast() {
  const { save, services } = useGame();
  const known = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    const ids = Object.keys(save.achievements);
    if (!known.current) {
      known.current = new Set(ids);
      return;
    }
    const fresh = ids.filter((id) => !known.current!.has(id));
    if (!fresh.length) return;
    for (const id of fresh) known.current.add(id);
    setQueue((q) => [...q, ...fresh]);
  }, [save.achievements]);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    services.audio.playSfx('save');
    const id = window.setTimeout(() => setQueue((q) => q.slice(1)), SHOW_MS);
    return () => window.clearTimeout(id);
  }, [current, services.audio]);

  const def = current ? achievementDefinition(current) : undefined;
  if (!def) return null;
  return (
    <div className="achievement-toast" role="status" key={current}>
      <span className="achievement-toast__label">LOGRO</span>
      <span className="achievement-toast__title">{def.title}</span>
      <span className="achievement-toast__desc">{def.description}</span>
    </div>
  );
}
