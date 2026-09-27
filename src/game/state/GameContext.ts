import { createContext } from 'react';
import type { FullscreenController } from '../../lib/fullscreen';
import type { Clock } from '../../lib/time';
import type { AudioEngine } from '../audio/types';
import type { BootResult, SaveManager } from '../save';
import type { GameAction } from './gameReducer';
import type { GameSave } from './types';

/** External services the game depends on. Injected so tests/debug can swap them. */
export interface GameServices {
  clock: Clock;
  saveManager: SaveManager;
  audio: AudioEngine;
  fullscreen: FullscreenController;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A game action without its timestamp; the provider stamps it from the clock. */
export type GameCommand = DistributiveOmit<GameAction, 'at'>;

export interface GameContextValue {
  save: GameSave;
  bootSource: BootResult['source'];
  services: GameServices;
  dispatch: (command: GameCommand) => void;
}

export const GameContext = createContext<GameContextValue | null>(null);
