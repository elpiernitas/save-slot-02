import { useState } from 'react';
import { useGame } from '../../state/useGame';
import { Menu } from '../../ui/Menu';
import { useMenu, type MenuItem } from '../../ui/useMenu';
import { continueTarget } from '../flow';
import type { SceneProps } from '../types';
import { SettingsPanel } from './SettingsPanel';
import { TitleBackdrop } from './TitleBackdrop';
import './TitleScene.css';

const ITEMS: readonly MenuItem[] = [
  { id: 'continue', label: 'CONTINUE' },
  { id: 'settings', label: 'SETTINGS' },
];

export function TitleScene(_: SceneProps) {
  const { save, dispatch } = useGame();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const menu = useMenu({
    items: ITEMS,
    enabled: !settingsOpen,
    onConfirm: (item) => {
      if (item.id === 'settings') {
        setSettingsOpen(true);
        return;
      }
      dispatch({ type: 'system/enteredGame' });
      dispatch({ type: 'scene/goTo', scene: continueTarget(save) });
    },
  });

  return (
    <div className="scene title">
      <TitleBackdrop />

      <header className="title__logo">
        <h1 className="title__name">
          SAVE SLOT <span className="title__number">02</span>
        </h1>
        <p className="title__tagline">SIDE QUEST: UNIDENTIFIED</p>
      </header>

      <nav className="title__menu">
        <Menu
          label="Title menu"
          items={ITEMS}
          selected={menu.selected}
          onHover={menu.select}
          onConfirm={menu.confirm}
        />
      </nav>

      {settingsOpen && (
        <div className="title__overlay">
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </div>
      )}

      <footer className="title__footer key-hints">
        <span>
          <kbd>↑↓</kbd>
          <kbd>W S</kbd>MOVE
        </span>
        <span>
          <kbd>ENTER</kbd>SELECT
        </span>
        {settingsOpen && (
          <span>
            <kbd>ESC</kbd>BACK
          </span>
        )}
      </footer>
      <span className="title__version">v0.1</span>
    </div>
  );
}
