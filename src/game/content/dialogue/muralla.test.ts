import { describe, expect, it } from 'vitest';
import { createRecordingHost } from '../../dialogue/effects';
import { plainText } from '../../dialogue/markup';
import {
  advanceDialogue,
  chooseOption,
  startDialogue,
  type DialogueState,
} from '../../dialogue/runtime';
import type { DialogueScript } from '../../dialogue/types';
import { validateDialogueScript } from '../../dialogue/validate';
import { PLAYER_CLASS_IDS } from '../../player/classes';
import { gameReducer } from '../../state/gameReducer';
import { createInitialSave } from '../../state/newGame';
import type { GameSave } from '../../state/types';
import { MURALLA_MAP } from '../../world/maps/muralla';
import { scriptForInteractable } from '../../world/scripts';
import { CAST } from '../cast';
import { PORTRAITS } from '../portraits';
import { MURALLA_ARRIVAL, MURALLA_FLAGS, MURALLA_SCRIPTS } from './muralla';

const now = new Date('2026-09-28T17:00:00Z');

function read(script: DialogueScript, save: GameSave, option?: string) {
  const rec = createRecordingHost(save, now);
  const text: string[] = [];
  let state: DialogueState = startDialogue(script, rec.host);
  for (let i = 0; state.status !== 'finished' && i < 50; i++) {
    if (state.status === 'choice') {
      state = chooseOption(script, state, option ?? state.options[0]!.option.id, rec.host);
      continue;
    }
    const node = script.nodes[state.nodeId];
    if (node?.type === 'line') text.push(plainText(node.pages[state.pageIndex]!));
    state = advanceDialogue(script, state, rec.host);
  }
  return { text, save: rec.snapshot() };
}

const fresh = () => createInitialSave(now);

describe('La Muralla dialogues', () => {
  it.each([MURALLA_ARRIVAL, ...Object.values(MURALLA_SCRIPTS)])('$id is valid', (script) => {
    expect(
      validateDialogueScript(script, { cast: CAST, portraitIds: Object.keys(PORTRAITS) }),
    ).toEqual([]);
  });

  it('every interactable opens an existing script (world → dialogue bridge)', () => {
    for (const item of MURALLA_MAP.interactables) {
      expect(scriptForInteractable(item), item.id).toBe(MURALLA_SCRIPTS[item.script]);
    }
    expect(
      scriptForInteractable({
        id: 'x',
        label: 'x',
        script: 'nope',
        rect: { x: 0, y: 0, w: 1, h: 1 },
      }),
    ).toBeNull();
  });

  it('the bollard has one distinct line per class (and a fallback)', () => {
    const lines = PLAYER_CLASS_IDS.map((classId) => {
      const save = gameReducer(fresh(), {
        type: 'player/assignClass',
        classId,
        at: now.toISOString(),
      });
      return read(MURALLA_SCRIPTS['muralla.bollard']!, save).text.slice(1).join(' ');
    });
    expect(new Set(lines).size).toBe(3);
    expect(read(MURALLA_SCRIPTS['muralla.bollard']!, fresh()).text[1]).toMatch(/No pasa nada más/);
  });

  it('the full terrace remembers being checked', () => {
    const first = read(MURALLA_SCRIPTS['muralla.table']!, fresh());
    expect(first.save.flags[MURALLA_FLAGS.tableSeen]).toBe(true);
    expect(read(MURALLA_SCRIPTS['muralla.table']!, first.save).text).toEqual([
      'Sigue llena. Nadie tiene prisa por irse.',
    ]);
  });

  it('the waitress records the answer and remembers the player', () => {
    const first = read(MURALLA_SCRIPTS['muralla.waitress']!, fresh(), 'table');
    expect(first.save.choices['muralla.waitressAnswer']).toBe('table');
    expect(read(MURALLA_SCRIPTS['muralla.waitress']!, first.save).text[0]).toMatch(/Otra vez/);
  });

  it('keeps out of scope topics out of the slice', () => {
    const all = [MURALLA_ARRIVAL, ...Object.values(MURALLA_SCRIPTS)]
      .flatMap((s) => Object.values(s.nodes))
      .flatMap((n) =>
        n.type === 'line'
          ? n.pages
          : n.type === 'choice'
            ? [n.prompt ?? '', ...n.options.map((o) => o.label)]
            : [],
      )
      .join(' ')
      .toLowerCase();
    for (const word of ['manu', 'randy', 'tarot', 'cita', 'hoyo', 'makro', 'ikea', 'player 2']) {
      expect(all).not.toContain(word);
    }
  });
});
