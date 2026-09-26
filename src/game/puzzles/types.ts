import type { PuzzleId } from '../state/types';

export type { PuzzleId };

export type PuzzleKind = 'routeSequence' | 'syncGrid' | 'microgame';

/** Static puzzle contract (GAME_06_SPEC §6). Runtime state lives in each puzzle module. */
export interface PuzzleDefinition {
  id: PuzzleId;
  title: string;
  kind: PuzzleKind;
  /** Optional puzzles never block the story and can always be left. */
  optional: boolean;
  estimatedSeconds: number;
}
