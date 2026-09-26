import type { DialogueScript, Speaker } from '../../dialogue/types';

/**
 * GAME-04 vertical slice: in front of La Muralla (the bar/café), afternoon. The slice shows the tone
 * (everyday things with RPG logic), it does not tell the story. Nothing here
 * explains why the place matters.
 */
const WAITRESS: Speaker = { id: 'waitress', displayName: 'CAMARERA', voice: 'default' };

export const MURALLA_FLAGS = {
  tableSeen: 'muralla.tableSeen',
  metWaitress: 'muralla.metWaitress',
  arrived: 'muralla.arrived',
} as const;

const line = (id: string, pages: string[], extra: Partial<DialogueScript['nodes'][string]> = {}) =>
  ({ id, type: 'line', pages, ...extra }) as DialogueScript['nodes'][string];

export const MURALLA_ARRIVAL: DialogueScript = {
  id: 'muralla.arrival',
  start: 'a',
  nodes: {
    a: line('a', ['Cimavilla, por la tarde.[pause] La ciudad huele a sal y a terraza.'], {
      effects: [{ kind: 'setFlag', flag: MURALLA_FLAGS.arrived, value: true }],
    }),
  },
};

export const MURALLA_SCRIPTS: Readonly<Record<string, DialogueScript>> = {
  'muralla.tree': {
    id: 'muralla.tree',
    start: 'a',
    nodes: {
      a: line('a', ['Un árbol enorme. Da sombra gratis,[pause] que por aquí es lo único gratis.']),
    },
  },

  'muralla.lamp': {
    id: 'muralla.lamp',
    start: 'a',
    nodes: {
      a: line('a', [
        'Una farola de hierro.[pause] Aún no se ha encendido; está esperando su momento.',
      ]),
    },
  },

  'muralla.gull': {
    id: 'muralla.gull',
    start: 'a',
    nodes: {
      a: line('a', [
        'Una gaviota te mira fijamente.[pause] Tú no llevas comida. Ella no se lo cree.',
      ]),
    },
  },

  'muralla.board': {
    id: 'muralla.board',
    start: 'a',
    nodes: {
      a: line('a', [
        'Una pizarra en la puerta:[pause] [sys]HOY: LO DE SIEMPRE.[/sys]',
        'Debajo, con otra letra:[pause] «MAÑANA: YA VEREMOS».',
      ]),
    },
  },

  'muralla.window': {
    id: 'muralla.window',
    start: 'a',
    nodes: {
      a: line('a', ['Dentro, alguien discute con la cafetera.[pause] Va ganando la cafetera.']),
    },
  },

  'muralla.door': {
    id: 'muralla.door',
    start: 'a',
    nodes: {
      a: line('a', [
        'Sale olor a café recién hecho y a conversación ajena.',
        'Hoy toca terraza.[pause] Lo ha decidido el sol, no tú.',
      ]),
    },
  },

  'muralla.table': {
    id: 'muralla.table',
    start: 'route',
    nodes: {
      route: {
        id: 'route',
        type: 'branch',
        branches: [{ when: { kind: 'flag', flag: MURALLA_FLAGS.tableSeen }, next: 'again' }],
        fallback: 'first',
      },
      first: line(
        'first',
        [
          'La terraza está llena. Ni una silla libre.',
          'Todo el mundo ha tenido la misma idea que tú.[pause] Antes.',
        ],
        { effects: [{ kind: 'setFlag', flag: MURALLA_FLAGS.tableSeen, value: true }] },
      ),
      again: line('again', ['Sigue llena.[pause] Nadie tiene prisa por irse.']),
    },
  },

  /** Class micro-variation (tests the `playerClass` condition). */
  'muralla.bollard': {
    id: 'muralla.bollard',
    start: 'intro',
    nodes: {
      intro: {
        ...line('intro', [
          'Un bolardo de hierro oscuro, bien plantado en la acera. Muy convencido de su papel.',
        ]),
        // First look → CITY CARD 002; the class only changes the flavour line.
        effects: [{ kind: 'giveCard', card: 'city.002.bollard' }],
        next: 'route',
      } as DialogueScript['nodes'][string],
      route: {
        id: 'route',
        type: 'branch',
        branches: [
          { when: { kind: 'playerClass', classId: 'warrior' }, next: 'warrior' },
          { when: { kind: 'playerClass', classId: 'tank' }, next: 'tank' },
          { when: { kind: 'playerClass', classId: 'healer' }, next: 'healer' },
        ],
        fallback: 'none',
      },
      warrior: line('warrior', [
        'Lo empujas para ver si cede.[pause] No cede. Este asalto lo gana él.',
      ]),
      tank: line('tank', [
        'Te apoyas en él.[pause] Aguantáis los dos sin moveros. Hay respeto mutuo.',
      ]),
      healer: line('healer', [
        'Le quitas el polvo con la manga.',
        '[pause]Nadie te lo había pedido.',
      ]),
      none: line('none', ['Lo miras. Te mira.[pause] No pasa nada más.']),
    },
  },

  'muralla.waitress': {
    id: 'muralla.waitress',
    start: 'route',
    speakers: [WAITRESS],
    nodes: {
      route: {
        id: 'route',
        type: 'branch',
        branches: [{ when: { kind: 'flag', flag: MURALLA_FLAGS.metWaitress }, next: 'again' }],
        fallback: 'hello',
      },
      hello: {
        id: 'hello',
        type: 'choice',
        speaker: 'waitress',
        prompt: '¡Buenas! ¿Vas a tomar algo?',
        recordAs: 'muralla.waitressAnswer',
        cancelOptionId: 'looking',
        // First small interaction at the café itself → CITY CARD 001 (GAME_05_SPEC §10).
        effects: [
          { kind: 'setFlag', flag: MURALLA_FLAGS.metWaitress, value: true },
          { kind: 'giveCard', card: 'city.001.la_muralla' },
        ],
        options: [
          { id: 'coffee', label: 'Un café.', next: 'coffee' },
          { id: 'table', label: '¿Hay mesa?', next: 'table' },
          { id: 'looking', label: 'Solo estoy mirando.', next: 'looking' },
        ],
      },
      coffee: line(
        'coffee',
        ['Marchando.[pause] Bueno, cuando la cafetera vuelva de su descanso, que va por libre.'],
        { speaker: 'waitress' },
      ),
      table: line(
        'table',
        ['Ahora mismo, todo lleno.[pause] Si alguien se levanta, eres el primero.'],
        {
          speaker: 'waitress',
        },
      ),
      looking: line('looking', ['Mirar es gratis.[pause] Sentarse ya es otra conversación.'], {
        speaker: 'waitress',
      }),
      again: line('again', ['¿Otra vez por aquí?[pause] La cafetera sigue a lo suyo.'], {
        speaker: 'waitress',
      }),
    },
  },
};
