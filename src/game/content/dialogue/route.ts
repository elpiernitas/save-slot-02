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
    a: sys('a', ['RUTA DE MISIÓN SECUNDARIA ACTUALIZADA\nDATOS DE RUTA RECUPERADOS: 18%'], {
      effects: [{ kind: 'setFlag', flag: ROUTE_FLAGS.updated, value: true }],
      next: 'b',
    }),
    b: say('b', ['Hay una ruta nueva.[pause] Eso normalmente sería una buena noticia.'], {
      next: 'c',
    }),
    c: sys('c', ['HAY QUE CALIBRAR LA RUTA']),
  },
};

export const beaconSynced = (
  symbol: BeaconSymbol,
  step: number,
  total: number,
): DialogueScript => ({
  id: 'route.beaconSynced',
  start: 'a',
  nodes: { a: sys('a', [`BALIZA ${SYMBOL_LABEL[symbol]} — SINCRONIZADA ${step}/${total}`]) },
});

export const BEACON_REJECTED: DialogueScript = {
  id: 'route.beaconRejected',
  start: 'a',
  nodes: {
    a: sys('a', ['SECUENCIA RECHAZADA.'], { next: 'b' }),
    b: say('b', ['Muy dramático para tres cosas en una calle.']),
  },
};

export const ROUTE_SOLVED: DialogueScript = {
  id: 'route.solved',
  start: 'a',
  nodes: {
    a: sys('a', ['RUTA SINCRONIZADA — OK'], {
      effects: [{ kind: 'giveCard', card: 'city.005.cimavilla_afternoon' }],
      next: 'b',
    }),
    b: say('b', ['Junto al bar, la puerta del 12 zumba.[pause] Las puertas no zumban.'], {
      next: 'c',
    }),
    c: sys('c', ['ACCESO DE SERVICIO EN LÍNEA']),
  },
};

/** The route node (door of nº 12) while calibrating: replays the pattern. */
export const ROUTE_NODE: DialogueScript = {
  id: 'route.node',
  start: 'a',
  nodes: { a: sys('a', ['NODO DE RUTA — PATRÓN DE CALIBRACIÓN']) },
};

export const SERVICE_ACCESS: DialogueScript = {
  id: 'route.serviceAccess',
  start: 'a',
  nodes: { a: sys('a', ['ACCESO DE SERVICIO — TERMINAL DE SINCRONIZACIÓN']) },
};

export const SERVICE_ACCESS_DONE: DialogueScript = {
  id: 'route.serviceAccessDone',
  start: 'a',
  nodes: {
    a: sys('a', ['ACCESO DE SERVICIO — SIN RESPUESTA'], { next: 'b' }),
    b: say('b', ['La puerta ha vuelto a ser una puerta.[pause] Sospechosamente normal.']),
  },
};

/* ---- PZ-03 PROTOCOLO DE LA GAVIOTA (content expansion) ---- */

/** Right after the beacons: something in the street blocks the route. */
export const SEAGULL_ALERT: DialogueScript = {
  id: 'route.seagullAlert',
  start: 'a',
  nodes: {
    a: sys('a', ['INTERFERENCIA EN LA RUTA\nORIGEN: GAVIOTA'], { next: 'b' }),
    b: say(
      'b',
      ['La gaviota de antes no ha dejado de mirarte.[pause] Ahora tiene una alerta con su nombre.'],
      {
        next: 'c',
      },
    ),
    c: sys('c', ['PROTOCOLO DE LA GAVIOTA — PENDIENTE']),
  },
};

export const SEAGULL_INTRO: DialogueScript = {
  id: 'route.seagullIntro',
  start: 'a',
  nodes: {
    a: say('a', ['La gaviota da un paso hacia ti.[pause] Te está calculando.'], { next: 'b' }),
    b: sys('b', ['PROTOCOLO DE LA GAVIOTA — INICIANDO']),
  },
};

/** The board, while the protocol is pending: the hint. */
export const SEAGULL_HINT: DialogueScript = {
  id: 'route.seagullHint',
  start: 'a',
  nodes: {
    a: say('a', [
      'En la pizarra, con letra nueva:[pause] [sys]NO DAR DE COMER A LAS GAVIOTAS.[/sys]',
      'Debajo, más pequeño:[pause] «si veis su sombra, moveos».',
    ]),
  },
};

export const SERVICE_BLOCKED: DialogueScript = {
  id: 'route.serviceBlocked',
  start: 'a',
  nodes: {
    a: sys('a', ['ACCESO DE SERVICIO — BLOQUEADO\nINTERFERENCIA EN LA RUTA'], { next: 'b' }),
    b: say('b', ['La puerta zumba, pero no se abre.[pause] Algo en la calle no la deja.']),
  },
};

export const seagullDone = (outcome: 'cleared' | 'bored'): DialogueScript => ({
  id: 'route.seagullDone',
  start: 'a',
  nodes: {
    a: sys(
      'a',
      [
        outcome === 'cleared'
          ? 'PROTOCOLO DE LA GAVIOTA — SUPERADO'
          : 'LA GAVIOTA HA PERDIDO EL INTERÉS',
      ],
      { effects: [{ kind: 'giveCard', card: 'city.003.seagull' }], next: 'b' },
    ),
    b: say('b', ['La gaviota se aleja muy digna.[pause] Como si hubiera sido idea suya.'], {
      next: 'c',
    }),
    c: sys('c', ['INTERFERENCIA RESUELTA\nACCESO DE SERVICIO EN LÍNEA']),
  },
});
