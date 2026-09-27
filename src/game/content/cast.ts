import type { Speaker } from '../dialogue/types';

/**
 * Global cast shared by every script. Scripts may add their own speakers.
 * Narration = a line without `speaker` (no name plate, no portrait).
 */
export const CAST: readonly Speaker[] = [
  {
    id: 'archivist',
    displayName: 'ARCHIVERO',
    defaultPortrait: 'archivist',
    voice: 'archivist',
  },
  { id: 'system', displayName: 'SISTEMA', voice: 'system', tone: 'system' },
];
