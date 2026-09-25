import type { ReactNode } from 'react';
import { InputBlocker } from '../../game/input/useInput';
import { useDisplayStatus } from '../../hooks/useDisplayStatus';
import type { DisplayStatus } from '../../lib/display';
import './DisplayGate.css';

/**
 * Runs before the game:
 * - phone-like device → diegetic "INCOMPATIBLE DISPLAY"; the game never mounts
 *   (no save is created).
 * - desktop window too small → "WINDOW TOO SMALL" overlay; the game resumes on
 *   its own when the window grows. If it was already running, it stays
 *   mounted underneath (state kept) with input blocked.
 */
export function DisplayGate({ children }: { children: ReactNode }) {
  const { status, hasBeenOk } = useDisplayStatus();

  if (status.kind === 'incompatible') return <IncompatibleDisplay />;

  return (
    <>
      {hasBeenOk && children}
      {status.kind === 'tooSmall' && (
        <>
          <WindowTooSmall status={status} />
          <InputBlocker />
        </>
      )}
    </>
  );
}

function IncompatibleDisplay() {
  return (
    <div className="display-gate" role="alert">
      <div className="display-gate__panel">
        <p className="display-gate__heading">SYSTEM CHECK</p>
        <p className="display-gate__error">INCOMPATIBLE DISPLAY</p>
        <p>THIS QUEST REQUIRES A COMPUTER.</p>
        <div className="display-gate__list">
          <p className="display-gate__dim">RETURN WITH:</p>
          <p>[ KEYBOARD ]</p>
          <p>[ BIGGER SCREEN ]</p>
          <p>[ QUESTIONABLE DECISIONS ]</p>
        </div>
        <p className="display-gate__dim display-gate__small">
          ERR 0x02 — POCKET-SIZED DEVICE DETECTED
        </p>
      </div>
    </div>
  );
}

function WindowTooSmall({ status }: { status: Extract<DisplayStatus, { kind: 'tooSmall' }> }) {
  return (
    <div className="display-gate display-gate--overlay" role="alert">
      <div className="display-gate__panel">
        <p className="display-gate__error">WINDOW TOO SMALL</p>
        <p>
          MAXIMIZE TO CONTINUE<span className="display-gate__blink">_</span>
        </p>
        <p className="display-gate__dim display-gate__small">
          MINIMUM {status.requiredWidth}×{status.requiredHeight}
        </p>
      </div>
    </div>
  );
}
