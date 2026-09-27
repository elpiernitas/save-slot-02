import { useState } from 'react';
import { useFullscreen } from '../../../hooks/useFullscreen';
import { INPUT_PRIORITY } from '../../input/inputRouter';
import {
  cycleOption,
  MOTION_OPTIONS,
  optionLabel,
  TEXT_SPEED_OPTIONS,
} from '../../state/settingsOptions';
import { useGame } from '../../state/useGame';
import { Menu } from '../../ui/Menu';
import { useMenu, type MenuItem } from '../../ui/useMenu';

/** Only settings that do something today. More arrive with their systems. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { save, services, dispatch } = useGame();
  const fullscreen = useFullscreen(services.fullscreen);
  const [notice, setNotice] = useState<string | null>(null);
  const { textSpeed, reducedMotion } = save.settings;
  const muted = save.settings.audio.muted;

  const toggleFullscreen = () => {
    if (fullscreen.active) {
      void services.fullscreen.exit();
      return;
    }
    void services.fullscreen.request().then((result) => {
      setNotice(result === 'denied' ? 'EL NAVEGADOR HA DENEGADO LA PANTALLA COMPLETA.' : null);
    });
  };

  const toggleSound = () =>
    dispatch({
      type: 'settings/update',
      settings: { audio: { muted: !muted } },
    });

  const items: MenuItem[] = [
    {
      id: 'fullscreen',
      label: 'PANTALLA COMPLETA',
      value: !fullscreen.supported ? 'N/A' : fullscreen.active ? 'SÍ' : 'NO',
      disabled: !fullscreen.supported,
    },
    { id: 'sound', label: 'SONIDO', value: muted ? 'NO' : 'SÍ' },
    {
      id: 'textSpeed',
      label: 'VELOCIDAD DEL TEXTO',
      value: optionLabel(TEXT_SPEED_OPTIONS, textSpeed),
    },
    { id: 'motion', label: 'MOVIMIENTO', value: optionLabel(MOTION_OPTIONS, reducedMotion) },
    { id: 'back', label: 'VOLVER' },
  ];

  const run = (item: MenuItem, dir: 1 | -1 = 1) => {
    switch (item.id) {
      case 'fullscreen':
        return toggleFullscreen();
      case 'sound':
        return toggleSound();
      case 'textSpeed':
        return dispatch({
          type: 'settings/update',
          settings: { textSpeed: cycleOption(TEXT_SPEED_OPTIONS, textSpeed, dir) },
        });
      case 'motion':
        return dispatch({
          type: 'settings/update',
          settings: { reducedMotion: cycleOption(MOTION_OPTIONS, reducedMotion, dir) },
        });
      default:
        return onClose();
    }
  };

  const menu = useMenu({
    items,
    priority: INPUT_PRIORITY.panel,
    onConfirm: (item) => run(item),
    onAdjust: (item, dir) => item.id !== 'back' && run(item, dir),
    onCancel: onClose,
  });

  return (
    <section className="rpg-box title-settings" aria-label="Ajustes">
      <h2 className="title-settings__heading">AJUSTES</h2>
      <Menu
        label="Ajustes"
        items={items}
        selected={menu.selected}
        onHover={menu.select}
        onConfirm={menu.confirm}
      />
      {notice && <p className="title-settings__notice tone-danger">{notice}</p>}
    </section>
  );
}
