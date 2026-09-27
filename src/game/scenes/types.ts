import type { ComponentType } from 'react';
import type { TrackId } from '../audio/types';
import type { SceneId } from './sceneIds';

/** Props every scene component receives. Scenes read/write state via `useGame()`. */
export interface SceneProps {
  sceneId: SceneId;
}

export interface SceneDefinition {
  id: SceneId;
  component: ComponentType<SceneProps>;
  /** Background music started on enter (GAME-11). */
  music?: TrackId;
}
