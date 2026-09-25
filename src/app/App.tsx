import { useState } from 'react';
import { GameViewport } from '../components';
import { SceneRenderer } from '../game/scenes';
import { GameProvider } from '../game/state';
import { useAudioUnlock } from '../hooks/useAudioUnlock';
import { createDefaultServices } from './services';

export function App() {
  const [services] = useState(createDefaultServices);
  useAudioUnlock(services.audio);

  return (
    <GameViewport>
      <GameProvider services={services}>
        <SceneRenderer />
      </GameProvider>
    </GameViewport>
  );
}
