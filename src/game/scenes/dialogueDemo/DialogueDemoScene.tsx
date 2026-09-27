import { ARCHIVIST_PORTRAIT } from '../../content/portraits';
import { DEMO_DIALOGUE } from '../../content/dialogue/demo';
import { Portrait } from '../../dialogue/ui/Portrait';
import { DialoguePlayer } from '../../dialogue/ui/DialoguePlayer';
import type { SpeakerView } from '../../dialogue/ui/DialogueBox';
import { useGame } from '../../state/useGame';
import type { SceneProps } from '../types';
import './DialogueDemoScene.css';

/**
 * GAME-02 test bench for the dialogue engine (not final content).
 * Reached from CONTINUE while no gameplay scene exists; returns to the title.
 */
export function DialogueDemoScene(_: SceneProps) {
  const { dispatch } = useGame();
  return (
    <div className="scene dialogue-demo">
      <p className="dialogue-demo__label">ARCHIVE://SLOT_02</p>
      <DialoguePlayer
        script={DEMO_DIALOGUE}
        onFinish={() => dispatch({ type: 'scene/goTo', scene: 'title' })}
        stage={(speaker) => <ArchiveStage speaker={speaker} />}
      />
    </div>
  );
}

function ArchiveStage({ speaker }: { speaker: SpeakerView | null }) {
  const talking = speaker?.speakerId === 'archivist';
  return (
    <div className="dialogue-demo__stage" aria-hidden="true">
      <div className="dialogue-demo__crt" data-on={talking || undefined}>
        <Portrait def={ARCHIVIST_PORTRAIT} expression={talking ? speaker?.expression : 'off'} />
      </div>
      <div className="dialogue-demo__floor" />
    </div>
  );
}
