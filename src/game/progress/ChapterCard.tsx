import { useEffect, useRef, useState } from 'react';
import { INPUT_PRIORITY } from '../input/inputRouter';
import { useInput } from '../input/useInput';
import { useGame } from '../state/useGame';
import { useReducedMotion } from '../ui/useReducedMotion';
import { chapterFor, chapterSeenFlag, type Chapter } from './chapters';
import './chapters.css';

const CARD_MS = 2200;

/**
 * One-shot chapter marker. It is intentionally an overlay, not a separate
 * scene: the rich world remains visible behind it and the player never loses
 * their position or gameplay context.
 */
export function ChapterCard({ sceneId }: { sceneId: string }) {
  const { save, dispatch } = useGame();
  const reduced = useReducedMotion();
  const chapter = chapterFor(save);
  const key = `${chapter.level}:${chapter.scene}`;
  const [visible, setVisible] = useState(false);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (
      sceneId !== chapter.scene ||
      save.flags[chapterSeenFlag(chapter.level)] ||
      seen.current.has(key)
    ) {
      return;
    }
    seen.current.add(key);
    setVisible(true);
    dispatch({ type: 'flag/set', flag: chapterSeenFlag(chapter.level), value: true });
    if (reduced) return;
    const id = window.setTimeout(() => setVisible(false), CARD_MS);
    return () => window.clearTimeout(id);
  }, [chapter, dispatch, key, reduced, save.flags, sceneId]);

  useInput(
    (input, { repeat }) => {
      if (visible && !repeat && (input === 'confirm' || input === 'cancel')) setVisible(false);
    },
    { priority: INPUT_PRIORITY.panel, enabled: visible },
  );

  if (!visible) return null;
  return <ChapterCardView chapter={chapter} onDismiss={() => setVisible(false)} />;
}

function ChapterCardView({ chapter, onDismiss }: { chapter: Chapter; onDismiss: () => void }) {
  return (
    <div className="chapter-card-layer" role="presentation" onClick={onDismiss}>
      <section className="chapter-card" role="status" aria-live="polite" aria-label="Capítulo">
        <span className="chapter-card__eyebrow">CAPÍTULO DESBLOQUEADO</span>
        <strong className="chapter-card__level">
          NIVEL {String(chapter.level).padStart(2, '0')}
        </strong>
        <h2>{chapter.title}</h2>
        <p>{chapter.objective}</p>
        <span className="chapter-card__hint">
          <kbd>ENTER</kbd> CONTINUAR
        </span>
      </section>
    </div>
  );
}
