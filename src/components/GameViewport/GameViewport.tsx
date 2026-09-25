import type { ReactNode } from 'react';
import './GameViewport.css';

/**
 * Full-window letterbox hosting the 16:9 stage. The stage is the largest
 * 16:9 box that fits the window (or the screen, in fullscreen). Everything the
 * player sees lives inside it; nothing scrolls.
 */
export function GameViewport({ children }: { children: ReactNode }) {
  return (
    <div className="game-viewport">
      <main className="game-stage">{children}</main>
    </div>
  );
}
