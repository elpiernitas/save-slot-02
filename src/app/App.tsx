import { useState } from 'react';
import { DisplayGate, GameViewport } from '../components';
import { InputProvider } from '../game/input';
import { SceneRenderer } from '../game/scenes';
import { GameProvider } from '../game/state';
import { useAudioUnlock } from '../hooks/useAudioUnlock';
import { createDefaultServices } from './services';

export function App() {
  const [services] = useState(createDefaultServices);
  useAudioUnlock(services.audio);

  return (
    <InputProvider>
      <DisplayGate>
        <GameViewport>
          <GameProvider services={services}>
            <SceneRenderer />
          </GameProvider>
        </GameViewport>
      </DisplayGate>
    </InputProvider>
  );
}
