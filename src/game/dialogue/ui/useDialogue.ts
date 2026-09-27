import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/useGame';
import type { GameSave } from '../../state/types';
import { createRecordingHost, executeEffects, type DialogueActionRegistry } from '../effects';
import {
  advanceDialogue,
  cancelChoice,
  chooseOption,
  DialogueError,
  startDialogue,
  type DialogueHost,
  type DialogueState,
} from '../runtime';
import type { DialogueEffect, DialogueScript } from '../types';

interface Session {
  state: DialogueState;
  /** Effects produced by the last step, executed after commit. */
  pending: readonly DialogueEffect[];
  /** Save as the runtime saw it after the last step (includes pending commands). */
  snapshot: GameSave;
  /** Increments on every step: lets the UI remount a page even if ids repeat. */
  step: number;
}

const NO_ACTIONS: DialogueActionRegistry = {};

/**
 * React controller around the pure runtime.
 *
 * Every step runs the runtime against a *recording host* (pure: it simulates
 * game commands with the real reducer and records effects). The resulting
 * effects are executed in an effect after commit — dispatch, SFX, registered
 * actions — so nothing with side effects ever runs during render.
 */
export function useDialogue(
  script: DialogueScript,
  {
    actions = NO_ACTIONS,
    onFinish,
  }: { actions?: DialogueActionRegistry; onFinish?: () => void } = {},
) {
  const { save, services, dispatch } = useGame();

  const run = (
    base: GameSave,
    stepIndex: number,
    step: (host: DialogueHost) => DialogueState,
  ): Session => {
    const rec = createRecordingHost(base, services.clock.now());
    let state: DialogueState;
    try {
      state = step(rec.host);
    } catch (error) {
      // A content bug must never soft-lock the game: log it and end the dialogue.
      if (!(error instanceof DialogueError)) throw error;
      console.error(`[dialogue] ${script.id}: ${error.message}`);
      state = { status: 'finished' };
    }
    return { state, pending: rec.effects, snapshot: rec.snapshot(), step: stepIndex };
  };

  const [session, setSession] = useState<Session>(() =>
    run(save, 0, (host) => startDialogue(script, host)),
  );

  // Latest known save for the next step (context save + not-yet-rendered effects).
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const executed = useRef<Session | null>(null);
  useEffect(() => {
    if (executed.current === session) return; // StrictMode re-run guard
    executed.current = session;
    saveRef.current = session.snapshot;
    executeEffects(session.pending, {
      dispatch,
      playSfx: (sfx) => services.audio.playSfx(sfx),
      actions,
      onUnsupported: (outcome) => console.warn(`[dialogue] ${script.id}: ${outcome.reason}`),
    });
    if (session.state.status === 'finished') onFinishRef.current?.();
  }, [session, dispatch, services.audio, actions, script.id]);

  const step = useCallback(
    (fn: (state: DialogueState, host: DialogueHost) => DialogueState | null) => {
      const current = session.state;
      let result: DialogueState | null = null;
      const next = run(saveRef.current, session.step + 1, (host) => {
        result = fn(current, host);
        return result ?? current;
      });
      if (result !== null) setSession(next);
      return result !== null;
    },
    // `run` only closes over stable values (clock, script).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session.state, session.step, script],
  );

  return {
    state: session.state,
    step: session.step,
    advance: () => step((s, host) => advanceDialogue(script, s, host)),
    choose: (optionId: string) => step((s, host) => chooseOption(script, s, optionId, host)),
    /** Escape on a menu. Returns false when the choice cannot be cancelled. */
    cancel: () => step((s, host) => cancelChoice(script, s, host)),
  };
}
