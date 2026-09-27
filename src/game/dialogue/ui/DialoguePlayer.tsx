import { useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { CAST } from '../../content/cast';
import { PORTRAITS } from '../../content/portraits';
import { useInput } from '../../input/useInput';
import { useGame } from '../../state/useGame';
import { Menu } from '../../ui/Menu';
import { useMenu, type MenuItem } from '../../ui/useMenu';
import type { DialogueActionRegistry } from '../effects';
import { parseMarkup, plainText } from '../markup';
import { getNode, type ChoiceView } from '../runtime';
import type { ChoiceNode, DialogueScript, LineNode } from '../types';
import { buildTimeline, resolveConfirm } from '../typewriter';
import { DialogueBox, type SpeakerView } from './DialogueBox';
import { DialogueText } from './DialogueText';
import { useDialogue } from './useDialogue';
import { useTypewriter } from './useTypewriter';
import './dialogue.css';

export interface DialoguePlayerProps {
  script: DialogueScript;
  actions?: DialogueActionRegistry;
  onFinish?: () => void;
  /** Optional scene art behind the box, driven by who is speaking. */
  stage?: (speaker: SpeakerView | null) => ReactNode;
  /** Where the box sits; `top` keeps the world character visible below it. */
  placement?: 'bottom' | 'top';
}

/** Plays a dialogue script: runtime + typewriter + input + rendering. */
export function DialoguePlayer({
  script,
  actions,
  onFinish,
  stage,
  placement = 'bottom',
}: DialoguePlayerProps) {
  const dialogue = useDialogue(script, {
    ...(actions && { actions }),
    ...(onFinish && { onFinish }),
  });
  const { state } = dialogue;
  // Shared across pages so a double click can't reveal and skip a new page.
  const lastActionRef = useRef(0);

  const node = state.status === 'finished' ? null : getNode(script, state.nodeId);
  const speaker =
    node && (node.type === 'line' || node.type === 'choice') ? describeSpeaker(script, node) : null;

  return (
    <div className="dlg-layer" data-placement={placement}>
      {stage?.(speaker)}
      {state.status === 'line' && node?.type === 'line' && speaker && (
        <LineView
          key={`${dialogue.step}:${node.id}:${state.pageIndex}`}
          text={node.pages[state.pageIndex] ?? ''}
          delayMultiplier={node.typewriter?.delayMultiplier}
          speaker={speaker}
          lastActionRef={lastActionRef}
          onAdvance={dialogue.advance}
        />
      )}
      {state.status === 'choice' && node?.type === 'choice' && speaker && (
        <ChoiceViewer
          key={`${dialogue.step}:${node.id}`}
          node={node}
          options={state.options}
          speaker={speaker}
          lastActionRef={lastActionRef}
          onChoose={dialogue.choose}
          onCancel={node.cancelOptionId ? dialogue.cancel : undefined}
        />
      )}
    </div>
  );
}

function describeSpeaker(script: DialogueScript, node: LineNode | ChoiceNode): SpeakerView {
  const all = [...CAST, ...(script.speakers ?? [])];
  const speaker = node.speaker ? all.find((s) => s.id === node.speaker) : undefined;
  const portraitId =
    node.portrait === null ? undefined : (node.portrait ?? speaker?.defaultPortrait);
  return {
    speakerId: speaker?.id ?? null,
    name: speaker?.displayName ?? null,
    tone: speaker?.tone ?? 'default',
    portrait: portraitId ? (PORTRAITS[portraitId] ?? null) : null,
    expression: node.expression,
    voice: speaker ? speaker.voice : 'narrator',
  };
}

/** Typed page (line text or choice prompt). Mounted once per page. */
function useTypedPage(text: string, speaker: SpeakerView, delayMultiplier?: number) {
  const { save, services } = useGame();
  const speed = save.settings.textSpeed;
  const { tokens, plain } = useMemo(
    () => ({ tokens: parseMarkup(text).tokens, plain: plainText(text) }),
    [text],
  );
  const timeline = useMemo(
    () => buildTimeline(tokens, speed, delayMultiplier),
    // Speed is read once per page on purpose: changing it mid-page would jump.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokens, delayMultiplier],
  );
  const voice = speaker.voice;
  const typer = useTypewriter(
    timeline,
    voice ? () => services.audio.playVoiceBlip(voice) : undefined,
  );
  return { ...typer, timeline, plain };
}

function LineView({
  text,
  delayMultiplier,
  speaker,
  lastActionRef,
  onAdvance,
}: {
  text: string;
  delayMultiplier: number | undefined;
  speaker: SpeakerView;
  lastActionRef: RefObject<number>;
  onAdvance: () => void;
}) {
  const page = useTypedPage(text, speaker, delayMultiplier);

  const confirm = (repeat: boolean) => {
    const now = performance.now();
    const action = resolveConfirm({
      typingDone: page.done,
      repeat,
      msSinceLastAction: now - lastActionRef.current,
    });
    if (action === 'ignore') return;
    lastActionRef.current = now;
    if (action === 'reveal') page.revealAll();
    else onAdvance();
  };

  useInput((input, { repeat }) => input === 'confirm' && confirm(repeat));

  return (
    <DialogueBox speaker={speaker} waiting={page.done} onClick={() => confirm(false)}>
      <DialogueText glyphs={page.timeline.glyphs} visible={page.visible} plain={page.plain} />
    </DialogueBox>
  );
}

function ChoiceViewer({
  node,
  options,
  speaker,
  lastActionRef,
  onChoose,
  onCancel,
}: {
  node: ChoiceNode;
  options: readonly ChoiceView[];
  speaker: SpeakerView;
  lastActionRef: RefObject<number>;
  onChoose: (id: string) => void;
  onCancel: (() => void) | undefined;
}) {
  const page = useTypedPage(node.prompt ?? '', speaker);
  const items: MenuItem[] = options.map(({ option, locked }) => ({
    id: option.id,
    label: option.label,
    disabled: locked,
  }));
  const menu = useMenu({
    items,
    enabled: page.done,
    onConfirm: (item) => {
      lastActionRef.current = performance.now();
      onChoose(item.id);
    },
    ...(onCancel && { onCancel }),
  });

  // While the prompt is typing, confirm reveals it (menu not active yet).
  useInput(
    (input, { repeat }) => {
      if (input !== 'confirm' || repeat) return;
      lastActionRef.current = performance.now();
      page.revealAll();
    },
    { enabled: !page.done },
  );

  return (
    <>
      {page.done && (
        <div className="dlg-choices rpg-box">
          <Menu
            label="Respuestas"
            items={items}
            selected={menu.selected}
            onHover={menu.select}
            onConfirm={menu.confirm}
          />
        </div>
      )}
      <DialogueBox
        speaker={speaker}
        waiting={false}
        onClick={page.done ? undefined : page.revealAll}
      >
        <DialogueText glyphs={page.timeline.glyphs} visible={page.visible} plain={page.plain} />
      </DialogueBox>
    </>
  );
}
