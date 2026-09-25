import { useState } from 'react';
import { useFullscreen } from '../../../hooks/useFullscreen';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import { useGame } from '../../state/useGame';
import { Menu } from '../../ui/Menu';
import { useMenu, type MenuItem } from '../../ui/useMenu';

/** Only settings that do something today. More arrive with their systems. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { save, services, dispatch } = useGame();
  const fullscreen = useFullscreen(services.fullscreen);
  const [notice, setNotice] = useState<string | null>(null);
  const muted = save.settings.audio.muted;

  const toggleFullscreen = () => {
    if (fullscreen.active) {
      void services.fullscreen.exit();
      return;
    }
    void services.fullscreen.request().then((result) => {
      setNotice(result === 'denied' ? 'FULLSCREEN DENIED BY THE BROWSER.' : null);
    });
  };

  const toggleSound = () =>
    dispatch({
      type: 'settings/update',
      settings: { audio: { ...save.settings.audio, muted: !muted } },
    });

  const items: MenuItem[] = [
    {
      id: 'fullscreen',
      label: 'FULLSCREEN',
      value: !fullscreen.supported ? 'N/A' : fullscreen.active ? 'ON' : 'OFF',
      disabled: !fullscreen.supported,
    },
    { id: 'sound', label: 'SOUND', value: muted ? 'OFF' : 'ON' },
    { id: 'back', label: 'BACK' },
  ];

  const run = (item: MenuItem) => {
    if (item.id === 'fullscreen') toggleFullscreen();
    else if (item.id === 'sound') toggleSound();
    else onClose();
  };

  const menu = useMenu({
    items,
    priority: INPUT_PRIORITY.panel,
    onConfirm: run,
    onAdjust: (item) => item.id !== 'back' && run(item),
    onCancel: onClose,
  });

  return (
    <section className="rpg-box title-settings" aria-label="Settings">
      <h2 className="title-settings__heading">SETTINGS</h2>
      <Menu
        label="Settings"
        items={items}
        selected={menu.selected}
        onHover={menu.select}
        onConfirm={menu.confirm}
      />
      {notice && <p className="title-settings__notice tone-danger">{notice}</p>}
    </section>
  );
}
