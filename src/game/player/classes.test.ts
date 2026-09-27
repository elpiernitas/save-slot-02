import { describe, expect, it } from 'vitest';
import { SIGILS } from '../content/sigils';
import {
  getPlayerClass,
  hasPlayerClass,
  isPlayerClassId,
  PLAYER_CLASS_IDS,
  PLAYER_CLASS_LIST,
  PLAYER_CLASSES,
} from './classes';

describe('player classes', () => {
  it('are exactly GUERRERO, TANQUE and CURADOR', () => {
    expect(PLAYER_CLASS_IDS).toEqual(['warrior', 'tank', 'healer']);
    expect(PLAYER_CLASS_LIST.map((c) => c.displayName)).toEqual(['GUERRERO', 'TANQUE', 'CURADOR']);
  });

  it('have unique ids, keys matching ids, and unique sigils/accents', () => {
    expect(new Set(PLAYER_CLASS_IDS).size).toBe(3);
    for (const [key, def] of Object.entries(PLAYER_CLASSES)) expect(def.id).toBe(key);
    expect(new Set(PLAYER_CLASS_LIST.map((c) => c.sigil)).size).toBe(3);
    expect(new Set(PLAYER_CLASS_LIST.map((c) => c.accent)).size).toBe(3);
  });

  it.each(PLAYER_CLASS_LIST)('$displayName has complete, card-sized content', (def) => {
    expect(def.shortDescription.length).toBeGreaterThan(0);
    expect(def.shortDescription.length).toBeLessThanOrEqual(34);
    expect(def.flavorLine.length).toBeLessThanOrEqual(40);
    expect(def.longDescription.length).toBeLessThanOrEqual(140);
    expect(def.traitLabels.length).toBeGreaterThan(0);
    expect(SIGILS[def.sigil]).toBeDefined();
  });

  it('validates ids and answers class questions', () => {
    expect(isPlayerClassId('tank')).toBe(true);
    expect(isPlayerClassId('mage')).toBe(false);
    expect(isPlayerClassId(null)).toBe(false);
    expect(getPlayerClass('healer').displayName).toBe('CURADOR');
    expect(hasPlayerClass({ player: { classId: 'tank' } }, 'tank')).toBe(true);
    expect(hasPlayerClass({ player: { classId: null } }, 'tank')).toBe(false);
  });

  it('sigil pixel art only uses its palette', () => {
    for (const art of Object.values(SIGILS)) {
      const used = new Set(art.rows.join('').replaceAll('.', ''));
      for (const c of used) expect(art.palette[c], c).toBeDefined();
    }
  });
});
