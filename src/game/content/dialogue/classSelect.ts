import type { DialogueScript } from '../../dialogue/types';

/** Set after the intro has been seen once, so a returning player gets the short version. */
export const CLASS_INTRO_SEEN_FLAG = 'classSelect.introSeen';

/** Before choosing: SYSTEM in English, narration in Spanish. Short. */
export const CLASS_SELECT_INTRO: DialogueScript = {
  id: 'classSelect.intro',
  start: 'start',
  nodes: {
    start: {
      id: 'start',
      type: 'branch',
      branches: [{ when: { kind: 'flag', flag: CLASS_INTRO_SEEN_FLAG }, next: 'again' }],
      fallback: 'missing',
    },
    missing: {
      id: 'missing',
      type: 'line',
      speaker: 'system',
      effects: [{ kind: 'setFlag', flag: CLASS_INTRO_SEEN_FLAG, value: true }],
      pages: ['FALTAN DATOS DE CLASE.', 'SE NECESITA LA ENTRADA DEL JUGADOR.'],
      next: 'narration',
    },
    narration: {
      id: 'narration',
      type: 'line',
      pages: [
        'Por lo visto, salir ahí fuera sin clase no es una cuestión de estilo.[pause] Es un trámite.',
        'Y los trámites, como todo el mundo sabe, [em]no se pueden saltar[/em].',
      ],
    },
    again: {
      id: 'again',
      type: 'line',
      speaker: 'system',
      pages: ['SIGUE FALTANDO LA ENTRADA DEL JUGADOR.'],
    },
  },
};

/**
 * After confirming. Also the micro-demo of class-dependent content: one
 * branch per class via the `playerClass` condition.
 */
export const CLASS_ASSIGNED: DialogueScript = {
  id: 'classSelect.assigned',
  start: 'route',
  nodes: {
    route: {
      id: 'route',
      type: 'branch',
      branches: [
        { when: { kind: 'playerClass', classId: 'warrior' }, next: 'warrior' },
        { when: { kind: 'playerClass', classId: 'tank' }, next: 'tank' },
        { when: { kind: 'playerClass', classId: 'healer' }, next: 'healer' },
      ],
      fallback: 'loading',
    },
    warrior: {
      id: 'warrior',
      type: 'line',
      speaker: 'system',
      pages: ['CLASE ASIGNADA: GUERRERO.'],
      next: 'warriorNote',
    },
    warriorNote: {
      id: 'warriorNote',
      type: 'line',
      pages: ['Primera prueba del guerrero:[pause] dejar de leer esto y seguir adelante.'],
      next: 'loading',
    },
    tank: {
      id: 'tank',
      type: 'line',
      speaker: 'system',
      pages: ['CLASE ASIGNADA: TANQUE.'],
      next: 'tankNote',
    },
    tankNote: {
      id: 'tankNote',
      type: 'line',
      pages: ['Lo que venga ahora no va a durar más que tú.[pause] Probablemente.'],
      next: 'loading',
    },
    healer: {
      id: 'healer',
      type: 'line',
      speaker: 'system',
      pages: ['CLASE ASIGNADA: CURADOR.'],
      next: 'healerNote',
    },
    healerNote: {
      id: 'healerNote',
      type: 'line',
      pages: [
        'Buena noticia: alguien tendrá que arreglar lo que rompan los demás.[pause] Mala noticia: [em]eres tú[/em].',
      ],
      next: 'loading',
    },
    loading: {
      id: 'loading',
      type: 'line',
      speaker: 'system',
      pages: ['CARGANDO MUNDO...'],
    },
  },
};
