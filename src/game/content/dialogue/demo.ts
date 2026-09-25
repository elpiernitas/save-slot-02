import type { DialogueScript } from '../../dialogue/types';

/**
 * GAME-02 engine demo. NOT final content: it only exercises the engine
 * (narration, speakers, expressions, pages, markup, pauses, a choice with a
 * locked and a hidden option, Escape to cancel, conditions, a flag, a stored
 * choice, an achievement and a replay branch after refresh).
 */
export const DEMO_FLAG_MET = 'demo.metArchivist';
export const DEMO_CHOICE = 'demo.survivalPlan';
export const DEMO_ACHIEVEMENT = 'demo.firstContact';

export const DEMO_DIALOGUE: DialogueScript = {
  id: 'demo',
  start: 'start',
  nodes: {
    start: {
      id: 'start',
      type: 'branch',
      branches: [{ when: { kind: 'flag', flag: DEMO_FLAG_MET }, next: 'again' }],
      fallback: 'intro',
    },

    // ---- First visit ------------------------------------------------------
    intro: {
      id: 'intro',
      type: 'line',
      pages: [
        'El cursor parpadea en un sitio donde no debería haber nada.',
        'Ni mapa. Ni menú. Solo un archivo que alguien olvidó cerrar.[pause] Y alguien que acaba de abrirlo.',
      ],
      next: 'alarm',
    },
    alarm: {
      id: 'alarm',
      type: 'line',
      speaker: 'system',
      pages: [
        'ACCESO NO AUTORIZADO DETECTADO.',
        'INICIANDO PROTOCOLO DE...[pause=500] EH...[pause=500] DE BIENVENIDA.',
      ],
      next: 'meet',
    },
    meet: {
      id: 'meet',
      type: 'line',
      speaker: 'archivist',
      expression: 'surprised',
      effects: [{ kind: 'setFlag', flag: DEMO_FLAG_MET, value: true }],
      pages: [
        'Ah.[pause] Un jugador.',
        'Hacía [em]años[/em] que nadie llegaba hasta aquí.[pause] Bueno, tres minutos. Pero se me han hecho años.',
      ],
      next: 'whoami',
    },
    whoami: {
      id: 'whoami',
      type: 'line',
      speaker: 'archivist',
      expression: 'smug',
      pages: [
        'Soy el Archivero. Custodio estos datos, les quito el polvo y, a veces, les hablo.',
        'Ellos no contestan.[pause=700] Casi nunca.',
      ],
      next: 'check',
    },
    check: {
      id: 'check',
      type: 'line',
      speaker: 'archivist',
      expression: 'confused',
      pages: [
        'Un momento.[pause] Tu ficha dice [em]LUIS[/em]...',
        '...y en CLASE pone [sys]UNASSIGNED[/sys].[pause] ¿Quién sale de casa [shake]sin clase[/shake]?',
      ],
      next: 'ask',
    },

    // ---- The choice -------------------------------------------------------
    ask: {
      id: 'ask',
      type: 'choice',
      speaker: 'archivist',
      expression: 'neutral',
      prompt: '¿Y bien? ¿Cómo piensas sobrevivir ahí fuera?',
      recordAs: DEMO_CHOICE,
      cancelOptionId: 'silence',
      options: [
        { id: 'charisma', label: 'Con carisma.', next: 'rCharisma' },
        { id: 'shortcuts', label: 'Me sé todos los atajos.', next: 'rShortcuts' },
        { id: 'silence', label: '...', next: 'rSilence' },
        {
          id: 'secret',
          label: 'Tengo un plan secreto.',
          next: 'rCharisma',
          condition: { kind: 'flag', flag: 'demo.hasSecretPlan' },
          showWhenLocked: true,
        },
        {
          id: 'skip',
          label: 'Saltar demo.',
          next: 'outro',
          condition: { kind: 'flag', flag: 'demo.debug' },
        },
      ],
    },
    rCharisma: {
      id: 'rCharisma',
      type: 'line',
      speaker: 'archivist',
      expression: 'happy',
      pages: ['¡Carisma![pause] La estadística más difícil de medir y la más fácil de exagerar.'],
      next: 'reward',
    },
    rShortcuts: {
      id: 'rShortcuts',
      type: 'line',
      speaker: 'archivist',
      expression: 'smug',
      pages: ['Los atajos. Claro.[pause] La mitad de los atajos son paredes con mucha confianza.'],
      next: 'reward',
    },
    rSilence: {
      id: 'rSilence',
      type: 'line',
      speaker: 'archivist',
      expression: 'annoyed',
      pages: [
        '[shake]...[/shake][pause] Vale. El silencio también es una respuesta.',
        'Una respuesta [slow]muy[/slow] incómoda.',
      ],
      next: 'reward',
    },
    reward: {
      id: 'reward',
      type: 'effect',
      effects: [
        { kind: 'unlockAchievement', achievement: DEMO_ACHIEVEMENT },
        { kind: 'playSfx', sfx: 'confirm' },
      ],
      next: 'note',
    },
    note: {
      id: 'note',
      type: 'line',
      speaker: 'archivist',
      expression: 'neutral',
      pages: [
        'Toma nota: este archivo [em]recuerda[/em] lo que eliges.[pause] [slow]Siempre.[/slow]',
        'Ahora vuelve al menú. Aquí todavía no hay suelo y no quiero que te caigas.',
      ],
      next: 'outro',
    },
    outro: {
      id: 'outro',
      type: 'line',
      speaker: 'system',
      pages: ['FIN DE LA DEMO.[pause] [fast]DEVOLVIENDO EL CONTROL AL JUGADOR...[/fast]'],
    },

    // ---- Returning player (flag + stored choice survive a refresh) --------
    again: {
      id: 'again',
      type: 'line',
      speaker: 'archivist',
      expression: 'surprised',
      pages: ['¿Otra vez tú?[pause] Pensaba que el cursor me estaba engañando.'],
      next: 'againRoute',
    },
    againRoute: {
      id: 'againRoute',
      type: 'branch',
      branches: [
        {
          when: { kind: 'choice', choice: DEMO_CHOICE, option: 'charisma' },
          next: 'againCharisma',
        },
        {
          when: { kind: 'choice', choice: DEMO_CHOICE, option: 'shortcuts' },
          next: 'againShortcuts',
        },
        { when: { kind: 'choice', choice: DEMO_CHOICE, option: 'silence' }, next: 'againSilence' },
      ],
      fallback: 'ask',
    },
    againCharisma: {
      id: 'againCharisma',
      type: 'line',
      speaker: 'archivist',
      expression: 'smug',
      pages: ['La última vez apostaste por el carisma.[pause] Veamos si sigue funcionando.'],
      next: 'ask',
    },
    againShortcuts: {
      id: 'againShortcuts',
      type: 'line',
      speaker: 'archivist',
      expression: 'smug',
      pages: ['La última vez dijiste que te sabías todos los atajos.[pause] Este no es uno.'],
      next: 'ask',
    },
    againSilence: {
      id: 'againSilence',
      type: 'line',
      speaker: 'archivist',
      expression: 'annoyed',
      pages: ['La última vez no dijiste nada.[pause] Lo apunté igualmente.'],
      next: 'ask',
    },
  },
};
