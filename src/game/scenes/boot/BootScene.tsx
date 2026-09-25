import { useOrientation } from '../../../hooks/useOrientation';
import { useGame } from '../../state/useGame';
import type { SceneProps } from '../types';
import './BootScene.css';

/**
 * GAME-00 system shell. Deliberately plain: it only proves that React, CSS,
 * the 16:9 stage, safe areas and the save layer work. GAME-01 replaces it
 * with the real boot sequence and title screen.
 */
export function BootScene({ sceneId }: SceneProps) {
  const { bootSource, services } = useGame();
  const orientation = useOrientation();

  return (
    <div className="scene boot-shell" data-scene={sceneId}>
      <h1 className="boot-shell__title">SAVE SLOT 02</h1>
      <p className="boot-shell__status">
        SYSTEM INITIALIZED
        <span className="boot-shell__cursor" aria-hidden="true">
          _
        </span>
      </p>
      <p className="boot-shell__phase">GAME-00</p>
      <dl className="boot-shell__diagnostics" aria-label="Diagnostics">
        <div>
          <dt>SAVE</dt>
          <dd>
            {bootSource.toUpperCase()} · {services.saveManager.driverName}
          </dd>
        </div>
        <div>
          <dt>VIEW</dt>
          <dd>{orientation.toUpperCase()}</dd>
        </div>
      </dl>
    </div>
  );
}
