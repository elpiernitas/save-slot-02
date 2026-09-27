import type { ReactNode } from 'react';
import type { PortraitDefinition } from '../portraits';
import { Portrait } from './Portrait';

export interface SpeakerView {
  speakerId: string | null;
  name: string | null;
  tone: 'default' | 'system';
  portrait: PortraitDefinition | null;
  expression: string | undefined;
  voice: string | undefined;
}

/**
 * The RPG text window: lower third of the stage, double pixel border, name
 * tab on the top edge, optional framed portrait, ▼ when waiting for input.
 */
export function DialogueBox({
  speaker,
  waiting,
  onClick,
  children,
}: {
  speaker: SpeakerView;
  waiting: boolean;
  onClick?: (() => void) | undefined;
  children: ReactNode;
}) {
  return (
    <section
      className="dlg-box"
      data-tone={speaker.tone}
      data-has-portrait={speaker.portrait ? true : undefined}
      onClick={onClick}
      aria-label={speaker.name ?? 'Narración'}
    >
      {speaker.name && <div className="dlg-name">{speaker.name}</div>}
      {speaker.portrait && (
        <div className="dlg-portrait">
          <Portrait def={speaker.portrait} expression={speaker.expression} />
        </div>
      )}
      <div className="dlg-body">{children}</div>
      {waiting && <span className="dlg-more more-indicator" aria-hidden="true" />}
    </section>
  );
}
