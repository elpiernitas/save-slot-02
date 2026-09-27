import { CHAPTERS, chapterFor } from './chapters';
import { useGame } from '../state/useGame';

/** Persistent, compact progress marker. It is guidance, not a second quest log. */
export function ChapterHud() {
  const { save } = useGame();
  const chapter = chapterFor(save);

  return (
    <aside className="chapter-hud" aria-label={`NIVEL ${String(chapter.level).padStart(2, '0')}`}>
      <div className="chapter-hud__head">
        <strong>NIVEL {String(chapter.level).padStart(2, '0')}</strong>
        <span>{chapter.title}</span>
      </div>
      <div className="chapter-hud__pips" aria-hidden="true">
        {CHAPTERS.map((entry) => (
          <i key={entry.level} data-active={entry.level <= chapter.level ? '' : undefined} />
        ))}
      </div>
      <p>{chapter.objective}</p>
    </aside>
  );
}
