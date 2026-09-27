import { describe, expect, it } from 'vitest';
import { createRecordingHost } from '../../dialogue/effects';
import { advanceDialogue, startDialogue, type DialogueState } from '../../dialogue/runtime';
import type { DialogueScript } from '../../dialogue/types';
import { plainText } from '../../dialogue/markup';
import { validateDialogueScript } from '../../dialogue/validate';
import { PLAYER_CLASS_IDS, PLAYER_CLASSES } from '../../player/classes';
import { gameReducer } from '../../state/gameReducer';
import { createInitialSave } from '../../state/newGame';
import type { GameSave } from '../../state/types';
import { CAST } from '../cast';
import { PORTRAITS } from '../portraits';
import { CLASS_ASSIGNED, CLASS_INTRO_SEEN_FLAG, CLASS_SELECT_INTRO } from './classSelect';

const now = new Date('2026-09-28T10:00:00Z');

function readAll(script: DialogueScript, save: GameSave) {
  const rec = createRecordingHost(save, now);
  const text: string[] = [];
  let state: DialogueState = startDialogue(script, rec.host);
  while (state.status === 'line') {
    const node = script.nodes[state.nodeId];
    if (node?.type === 'line') text.push(plainText(node.pages[state.pageIndex]!));
    state = advanceDialogue(script, state, rec.host);
  }
  return { text, save: rec.snapshot(), status: state.status };
}

describe('class select dialogues', () => {
  it.each([CLASS_SELECT_INTRO, CLASS_ASSIGNED])(
    '$id is valid (no errors, no warnings)',
    (script) => {
      expect(
        validateDialogueScript(script, { cast: CAST, portraitIds: Object.keys(PORTRAITS) }),
      ).toEqual([]);
    },
  );

  it('intro: full version once, short version afterwards', () => {
    const first = readAll(CLASS_SELECT_INTRO, createInitialSave(now));
    expect(first.text[0]).toBe('FALTAN DATOS DE CLASE.');
    expect(first.save.flags[CLASS_INTRO_SEEN_FLAG]).toBe(true);
    expect(readAll(CLASS_SELECT_INTRO, first.save).text).toEqual([
      'SIGUE FALTANDO LA ENTRADA DEL JUGADOR.',
    ]);
  });

  it.each(PLAYER_CLASS_IDS)(
    'assigned: the "%s" branch names its class and ends loading',
    (classId) => {
      const save = gameReducer(createInitialSave(now), {
        type: 'player/assignClass',
        classId,
        at: now.toISOString(),
      });
      const run = readAll(CLASS_ASSIGNED, save);
      expect(run.text[0]).toBe(`CLASE ASIGNADA: ${PLAYER_CLASSES[classId].displayName}.`);
      expect(run.text.at(-1)).toBe('CARGANDO MUNDO...');
      expect(run.status).toBe('finished');
    },
  );

  it('never mentions the date, Manu or romance', () => {
    const all = [CLASS_SELECT_INTRO, CLASS_ASSIGNED]
      .flatMap((s) => Object.values(s.nodes))
      .flatMap((n) => (n.type === 'line' ? n.pages : []))
      .join(' ')
      .toLowerCase();
    for (const word of ['manu', 'cita', 'amor', 'player 2']) expect(all).not.toContain(word);
  });
});
