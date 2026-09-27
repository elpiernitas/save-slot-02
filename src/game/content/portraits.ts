import type { PortraitDefinition } from '../dialogue/portraits';

/**
 * Original placeholder portraits (drawn here, no external images).
 * Final portraits of the real characters are NOT designed yet.
 */

/** "El Archivero": a sentient CRT monitor that guards the save file. */
export const ARCHIVIST_PORTRAIT: PortraitDefinition = {
  id: 'archivist',
  palette: {
    o: '#05040a', // outline
    B: '#5d5873', // bezel
    b: '#3a3650', // bezel shadow
    s: '#0e2a24', // screen
    l: '#123a31', // scanline
    e: '#7ee2a8', // eyes (phosphor)
    m: '#7ee2a8', // mouth
    r: '#ef6f6c', // power led
  },
  base: [
    '................',
    '.oooooooooooooo.',
    '.oBBBBBBBBBBBBo.',
    '.oBssssssssssbo.',
    '.oBllllllllllbo.',
    '.oBssssssssssbo.',
    '.oBllllllllllbo.',
    '.oBssssssssssbo.',
    '.oBllllllllllbo.',
    '.oBssssssssssbo.',
    '.oBbbbbbbbbbbro.',
    '.oooooooooooooo.',
    '......oBBo......',
    '....oooooooo....',
    '....oBBBBBBo....',
    '....oooooooo....',
  ],
  faceOrigin: { x: 3, y: 3 },
  expressions: {
    neutral: [
      '..........',
      '..ee..ee..',
      '..ee..ee..',
      '..........',
      '...mmmm...',
      '..........',
      '..........',
    ],
    happy: [
      '..........',
      '..e....e..',
      '.e.e..e.e.',
      '..........',
      '..m....m..',
      '...mmmm...',
      '..........',
    ],
    confused: [
      '..........',
      '..ee...e..',
      '..ee..e.e.',
      '..........',
      '....mm.m..',
      '...m..m...',
      '..........',
    ],
    annoyed: [
      '..........',
      '.eee..eee.',
      '..ee..ee..',
      '..........',
      '..mmmmmm..',
      '..........',
      '..........',
    ],
    smug: [
      '..........',
      '..........',
      '.eee..eee.',
      '..........',
      '......m...',
      '..mmmm....',
      '..........',
    ],
    surprised: [
      '..........',
      '..ee..ee..',
      '..ee..ee..',
      '..........',
      '....mm....',
      '....mm....',
      '..........',
    ],
    /** Screen off: used by scene art while the archivist is not talking. */
    off: [
      'ssssssssss',
      'ssssssssss',
      'ssssssssss',
      'ssssssssss',
      'ssssssssss',
      'ssssssssss',
      'ssssssssss',
    ],
  },
};

export const PORTRAITS: Readonly<Record<string, PortraitDefinition>> = {
  [ARCHIVIST_PORTRAIT.id]: ARCHIVIST_PORTRAIT,
};
