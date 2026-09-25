import type { ReactNode } from 'react';
import { useOrientation } from '../../hooks/useOrientation';
import './GameViewport.css';

/**
 * Full-screen letterbox that hosts a 16:9 stage, kept inside the iPhone safe
 * areas (notch / Dynamic Island / home indicator). Everything the player sees
 * lives inside the stage; nothing scrolls.
 *
 * `data-orientation` lets CSS and GAME-01 react to portrait mode.
 */
export function GameViewport({ children }: { children: ReactNode }) {
  const orientation = useOrientation();
  return (
    <div className="game-viewport" data-orientation={orientation}>
      <main className="game-stage">{children}</main>
    </div>
  );
}
