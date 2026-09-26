import { useCallback, useEffect, useState } from 'react';
import { chosenRouteLabel } from '../dateGate/routes';
import { DialogueBox } from '../dialogue/ui/DialogueBox';
import '../dialogue/ui/dialogue.css';
import { INPUT_PRIORITY } from '../input/inputRouter';
import { useInput } from '../input/useInput';
import type { SceneProps } from '../scenes/types';
import { useGame } from '../state/useGame';
import '../boss/desync/desync.css';
import '../dateGate/dateGate.css';
import { Party } from './Party';
import { ENDING_BEATS, ENDING_COPY } from './ending';
import './ending.css';

const MANU_SPEAKER = {
  speakerId: 'manu',
  name: ENDING_COPY.speaker,
  tone: 'default' as const,
  portrait: null,
  expression: undefined,
  voice: undefined,
};

/**
 * Scene `ending` (GAME-09): SAVING... → SIDE QUEST — COMPLETE → both players
 * + one line → the chosen route → SAVE SLOT 02 — UPDATED → `saveSlot`.
 * Completion is written when SIDE QUEST — COMPLETE shows, so a refresh from
 * there on lands on the save slot instead of replaying the ending.
 */
export function EndingScene(_: SceneProps) {
  const { save, dispatch, services } = useGame();
  const option = save.dateQuest.chosenOptionId;
  const [index, setIndex] = useState(0);
  const beat = ENDING_BEATS[index]!;
  const last = index === ENDING_BEATS.length - 1;

  const next = useCallback(() => {
    if (last) dispatch({ type: 'scene/goTo', scene: 'saveSlot' });
    else setIndex((i) => i + 1);
  }, [last, dispatch]);

  // No route, no ending: back to the gate (never a null date on screen).
  useEffect(() => {
    if (!option) dispatch({ type: 'scene/goTo', scene: 'dateGate' });
  }, [option, dispatch]);

  useEffect(() => {
    if (beat.id === 'complete') {
      dispatch({ type: 'game/complete' });
      services.audio.playSfx('boot');
    }
    if (beat.id === 'updated') services.audio.playSfx('confirm');
  }, [beat, dispatch, services.audio]);

  useEffect(() => {
    if (beat.ms === null) return;
    const id = window.setTimeout(next, beat.ms);
    return () => window.clearTimeout(id);
  }, [beat, next]);

  useInput(
    (input, { repeat }) => {
      if (input === 'confirm' && !repeat) next();
    },
    { priority: INPUT_PRIORITY.scene },
  );

  if (!option) return null;
  return (
    <div className="reveal ending" aria-label={ENDING_COPY.complete}>
      <div className="date-gate__sky" aria-hidden="true" />

      {beat.id === 'saving' && (
        <div className="desync__card ending__card" onClick={next}>
          <p>{ENDING_COPY.saving}</p>
          <span className="ending__bar" aria-hidden="true">
            <i />
          </span>
        </div>
      )}

      {beat.id === 'complete' && (
        <div className="desync__card ending__card" onClick={next}>
          <p className="ending__checksum">{ENDING_COPY.checksum}</p>
          <p className="desync__title">{ENDING_COPY.complete}</p>
        </div>
      )}

      {(beat.id === 'party' || beat.id === 'route') && (
        <div className="ending__stage" onClick={beat.id === 'route' ? next : undefined}>
          {beat.id === 'route' && (
            <div className="ending__route" role="status">
              <p className="ending__route-label">{ENDING_COPY.route}</p>
              <p className="ending__route-date">{chosenRouteLabel(option)}</p>
            </div>
          )}
          <Party />
          {beat.id === 'party' && (
            <div className="dlg-layer" data-placement="top">
              <DialogueBox speaker={MANU_SPEAKER} waiting onClick={next}>
                {ENDING_COPY.line}
              </DialogueBox>
            </div>
          )}
        </div>
      )}

      {beat.id === 'updated' && (
        <div className="desync__card ending__card" onClick={next}>
          <p className="desync__title">{ENDING_COPY.updated}</p>
        </div>
      )}
    </div>
  );
}
