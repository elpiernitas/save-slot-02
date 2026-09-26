import type { DialogueScript } from '../../dialogue/types';
import { SYMBOL_LABEL, type BeaconSymbol } from '../../puzzles/routeBeacons/routeBeacons';

/**
 * GAME-06 in La Muralla (plan in PR, option A): the side quest's route
 * updates, three ordinary things become beacons, then SERVICE ACCESS.
 * SYSTEM lines are English retro; narration is Spanish. No PLAYER 2 reveal.
 */
export const ROUTE_FLAGS = {
  updated: 'route.updated',
  /** Set by the SYNC TERMINAL fallback; GAME-07 starts from it. */
  player2SignalMissing: 'system.player2SignalMissing',
} as const;

const sys = (id: string, pages: string[], extra: object = {}) =>
  ({ id, type: 'line', speaker: 'system', pages, ...extra }) as DialogueScript['nodes'][string];
const say = (id: string, pages: string[], extra: object = {}) =>
  ({ id, type: 'line', pages, ...extra }) as DialogueScript['nodes'][string];

export const ROUTE_UPDATE: DialogueScript = {
  id: 'route.update',
  start: 'a',
  nodes: {
    a: sys('a', ['SIDE QUEST ROUTE UPDATED\nROUTE DATA RECOVERED: 18%'], {
      effects: [{ kind: 'setFlag', flag: ROUTE_FLAGS.updated, value: true }],
      next: 'b',
    }),
    b: say('b', ['Hay una ruta nueva.[pause] Eso normalmente sería una buena noticia.'], {
      next: 'c',
    }),
    c: sys('c', ['ROUTE CALIBRATION REQUIRED']),
  },
};

export const beaconSynced = (
  symbol: BeaconSymbol,
  step: number,
  total: number,
): DialogueScript => ({
  id: 'route.beaconSynced',
  start: 'a',
  nodes: { a: sys('a', [`BEACON ${SYMBOL_LABEL[symbol]} — SYNC ${step}/${total}`]) },
});

export const BEACON_REJECTED: DialogueScript = {
  id: 'route.beaconRejected',
  start: 'a',
  nodes: {
    a: sys('a', ['SEQUENCE REJECTED.'], { next: 'b' }),
    b: say('b', ['Muy dramático para tres cosas en una calle.']),
  },
};

export const ROUTE_SOLVED: DialogueScript = {
  id: 'route.solved',
  start: 'a',
  nodes: {
    a: sys('a', ['ROUTE SYNC — OK'], {
      effects: [{ kind: 'giveCard', card: 'city.005.cimavilla_afternoon' }],
      next: 'b',
    }),
    b: say('b', ['Junto al bar, la puerta del 12 zumba.[pause] Las puertas no zumban.'], {
      next: 'c',
    }),
    c: sys('c', ['SERVICE ACCESS ONLINE']),
  },
};

/** The route node (door of nº 12) while calibrating: replays the pattern. */
export const ROUTE_NODE: DialogueScript = {
  id: 'route.node',
  start: 'a',
  nodes: { a: sys('a', ['ROUTE NODE — CALIBRATION PATTERN']) },
};

export const SERVICE_ACCESS: DialogueScript = {
  id: 'route.serviceAccess',
  start: 'a',
  nodes: { a: sys('a', ['SERVICE ACCESS — SYNC TERMINAL']) },
};

export const SERVICE_ACCESS_DONE: DialogueScript = {
  id: 'route.serviceAccessDone',
  start: 'a',
  nodes: {
    a: sys('a', ['SERVICE ACCESS — NO RESPONSE'], { next: 'b' }),
    b: say('b', ['La puerta ha vuelto a ser una puerta.[pause] Sospechosamente normal.']),
  },
};
