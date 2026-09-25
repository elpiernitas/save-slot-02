import { PLAYER_CLASS_IDS, type PlayerClassId } from '../../player/classes';

/**
 * Class selection as a pure state machine. The scene renders it; nothing is
 * saved until `confirm` in the confirmation window returns an `assign`
 * command.
 *
 *   intro ──introDone──► browse ──requestConfirm──► confirm ──confirm──► assigned
 *                          ▲  │escape → exitToTitle     │cancel/escape
 *                          └──┴─────────────────────────┘
 */
export type ClassSelectPhase = 'intro' | 'browse' | 'confirm' | 'assigned';

export interface ClassSelectState {
  phase: ClassSelectPhase;
  /** Highlighted class (index into PLAYER_CLASS_IDS). */
  index: number;
}

export type ClassSelectEvent =
  | { type: 'introDone' }
  | { type: 'move'; dir: 1 | -1 }
  | { type: 'highlight'; index: number }
  | { type: 'requestConfirm' }
  | { type: 'cancelConfirm' }
  | { type: 'confirm' }
  | { type: 'escape' };

export type ClassSelectCommand =
  { kind: 'assign'; classId: PlayerClassId } | { kind: 'exitToTitle' } | null;

export const INITIAL_CLASS_SELECT: ClassSelectState = { phase: 'intro', index: 0 };

export function classSelectStep(
  state: ClassSelectState,
  event: ClassSelectEvent,
): { state: ClassSelectState; command: ClassSelectCommand } {
  const count = PLAYER_CLASS_IDS.length;
  const stay = { state, command: null };

  switch (state.phase) {
    case 'intro':
      return event.type === 'introDone'
        ? { state: { ...state, phase: 'browse' }, command: null }
        : stay;

    case 'browse':
      switch (event.type) {
        case 'move':
          return {
            state: { ...state, index: (state.index + event.dir + count) % count },
            command: null,
          };
        case 'highlight':
          return event.index >= 0 && event.index < count
            ? { state: { ...state, index: event.index }, command: null }
            : stay;
        case 'requestConfirm':
          return { state: { ...state, phase: 'confirm' }, command: null };
        case 'escape':
          return { state, command: { kind: 'exitToTitle' } };
        default:
          return stay;
      }

    case 'confirm':
      switch (event.type) {
        case 'confirm':
          return {
            state: { ...state, phase: 'assigned' },
            command: { kind: 'assign', classId: PLAYER_CLASS_IDS[state.index]! },
          };
        case 'cancelConfirm':
        case 'escape':
          return { state: { ...state, phase: 'browse' }, command: null };
        default:
          return stay;
      }

    case 'assigned':
      return stay;
  }
}
