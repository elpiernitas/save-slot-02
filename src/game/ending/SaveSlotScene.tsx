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
import { Party } from './Party';
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
  const { save, dispatch } = useGame();
  const rows = saveSlotRows(save);
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
        <dl className="save-slot__rows">
          {rows.map((row) => (
            <div key={row.label} className="save-slot__row" data-row={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
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
