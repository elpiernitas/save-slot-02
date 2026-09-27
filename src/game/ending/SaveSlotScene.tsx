import { useEffect, useState } from 'react';
import { CardBinder } from '../inventory/ui/CardBinder';
import '../inventory/ui/inventory.css';
import { SettingsPanel } from '../scenes/title/SettingsPanel';
import '../scenes/title/TitleScene.css';
import type { SceneProps } from '../scenes/types';
import { useGame } from '../state/useGame';
import { Menu } from '../ui/Menu';
import { useMenu, type MenuItem } from '../ui/useMenu';
import '../boss/desync/desync.css';
import '../dateGate/dateGate.css';
import { saveSlotRows } from './ending';
import { PACK_ART } from '../art/pack';
import { Party } from './Party';
import { postgameStatus, RANDY_LINE, RANDY_UNLOCK } from './postgame';
import './ending.css';

const ITEMS: readonly MenuItem[] = [
  { id: 'cards', label: 'CITY CARDS' },
  { id: 'settings', label: 'AJUSTES' },
  { id: 'title', label: 'VOLVER AL TÍTULO' },
];

/**
 * Scene `saveSlot` (GAME-09): the persistent home of a completed save. It
 * only reads the save; nothing here can reset it or change the date.
 */
export function SaveSlotScene(_: SceneProps) {
  const { save, dispatch, services } = useGame();
  const rows = saveSlotRows(save);
  // GAME-10 (small): route status derived from today's Madrid date.
  const [status] = useState(() =>
    save.dateQuest.chosenOptionId
      ? postgameStatus(save.dateQuest.chosenOptionId, services.clock.now())
      : null,
  );
  // The one post-game unlock: Randy turns up on the completed save slot.
  const completed = Boolean(rows);
  useEffect(() => {
    if (completed) dispatch({ type: 'unlock/grant', unlock: RANDY_UNLOCK });
  }, [completed, dispatch]);
  const randy = Object.hasOwn(save.unlocks, RANDY_UNLOCK);
  const [randyTalks, setRandyTalks] = useState(false);
  const [panel, setPanel] = useState<'cards' | 'settings' | null>(null);

  // Not complete (should not happen through normal flow): back to the story.
  useEffect(() => {
    if (!rows) dispatch({ type: 'scene/goTo', scene: 'title' });
  }, [rows, dispatch]);

  const menu = useMenu({
    items: ITEMS,
    enabled: panel === null,
    onConfirm: (item) => {
      if (item.id === 'title') dispatch({ type: 'scene/goTo', scene: 'title' });
      else setPanel(item.id as 'cards' | 'settings');
    },
  });

  if (!rows) return null;
  return (
    <div className="reveal ending save-slot" aria-label="SAVE SLOT 02">
      <div className="date-gate__sky" aria-hidden="true" />
      <section className="save-slot__card" aria-label="SAVE SLOT 02">
        <header className="save-slot__head">
          <span>SAVE SLOT 02</span>
          <span className="save-slot__ok">ESTADO — OK</span>
        </header>
        <div className="save-slot__body">
          <img className="save-slot__photo" src={PACK_ART.polaroid} alt="" draggable={false} />
          <dl className="save-slot__rows">
            {rows.map((row) => (
              <div key={row.label} className="save-slot__row" data-row={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
            {status && (
              <div className="save-slot__row save-slot__row--status" data-row="ESTADO">
                <dt>{status.label}</dt>
                <dd>{status.value}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>
      <nav className="save-slot__menu">
        <Menu
          label="SAVE SLOT 02"
          items={ITEMS}
          selected={menu.selected}
          onHover={menu.select}
          onConfirm={menu.confirm}
        />
      </nav>
      <Party />
      {randy && (
        <button
          type="button"
          tabIndex={-1}
          className="save-slot__randy"
          aria-label="Randy"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setRandyTalks((t) => !t)}
        >
          <img src={PACK_ART.randy} alt="" draggable={false} />
          {randyTalks && <span className="save-slot__randy-line">{RANDY_LINE}</span>}
        </button>
      )}

      {panel === 'cards' && (
        <div className="inv-layer">
          <CardBinder onBack={() => setPanel(null)} />
        </div>
      )}
      {panel === 'settings' && (
        <div className="title__overlay">
          <SettingsPanel onClose={() => setPanel(null)} />
        </div>
      )}
    </div>
  );
}
