import { describe, expect, it } from 'vitest';
import { evaluateCondition, type Condition } from './conditions';
import { createInitialSave } from './newGame';
import type { GameSave } from './types';

const now = new Date('2026-10-03T19:00:00Z'); // Sat 3 Oct, 21:00 Madrid

function saveWith(patch: (s: GameSave) => void): GameSave {
  const save = createInitialSave(new Date('2026-09-28T09:00:00Z'));
  patch(save);
  return save;
}

const check = (condition: Condition, save: GameSave) => evaluateCondition(condition, { save, now });

describe('evaluateCondition', () => {
  const save = saveWith((s) => {
    s.flags = { door: true, coins: 3 };
    s.choices = { answer: 'yes' };
    s.inventory.items = { key: { quantity: 1, acquiredAt: '2026-09-28T09:00:00.000Z' } };
    s.achievements = { first: { unlockedAt: '2026-09-28T09:00:00.000Z' } };
    s.quests = {
      main: { status: 'active', stepIndex: 0, startedAt: null, completedAt: null },
    };
  });

  it('checks flags (truthy or exact value)', () => {
    expect(check({ kind: 'flag', flag: 'door' }, save)).toBe(true);
    expect(check({ kind: 'flag', flag: 'missing' }, save)).toBe(false);
    expect(check({ kind: 'flag', flag: 'coins', equals: 3 }, save)).toBe(true);
    expect(check({ kind: 'flag', flag: 'coins', equals: 4 }, save)).toBe(false);
  });

  it('checks choices, items, achievements and quests', () => {
    expect(check({ kind: 'choice', choice: 'answer', option: 'yes' }, save)).toBe(true);
    expect(check({ kind: 'hasItem', item: 'key' }, save)).toBe(true);
    expect(check({ kind: 'hasItem', item: 'key', min: 2 }, save)).toBe(false);
    expect(check({ kind: 'achievement', achievement: 'first' }, save)).toBe(true);
    expect(check({ kind: 'achievement', achievement: 'toString' }, save)).toBe(false);
    expect(check({ kind: 'quest', quest: 'main', status: 'active' }, save)).toBe(true);
    expect(check({ kind: 'quest', quest: 'unknown', status: 'hidden' }, save)).toBe(true);
  });

  it('combines conditions', () => {
    const both: Condition = {
      kind: 'all',
      conditions: [
        { kind: 'flag', flag: 'door' },
        { kind: 'not', condition: { kind: 'bossDefeated' } },
      ],
    };
    expect(check(both, save)).toBe(true);
    expect(check({ kind: 'any', conditions: [] }, save)).toBe(false);
    expect(check({ kind: 'all', conditions: [] }, save)).toBe(true);
  });

  it('evaluates time gates relative to the chosen date', () => {
    const gate: Condition = {
      kind: 'time',
      gate: { kind: 'relativeToChosenDate', offsetDays: -1, hour: 20 },
    };
    expect(check({ kind: 'dateChosen' }, save)).toBe(false);
    expect(check(gate, save)).toBe(false);

    const chosen = saveWith((s) => {
      s.dateQuest = { chosenOptionId: 'sun-04-oct', chosenAt: '2026-09-28T10:00:00.000Z' };
    });
    expect(check({ kind: 'dateChosen' }, chosen)).toBe(true);
    expect(check(gate, chosen)).toBe(true);
  });
});
