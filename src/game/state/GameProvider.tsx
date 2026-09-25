import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { BootResult } from '../save';
import { gameReducer, type GameAction } from './gameReducer';
import { GameContext, type GameCommand, type GameServices } from './GameContext';

interface GameProviderProps {
  services: GameServices;
  children: ReactNode;
  /** Rendered while the save is loading (usually a few ms). */
  fallback?: ReactNode;
}

/**
 * Loads the save once, owns the in-memory game state and autosaves every
 * change through the save layer. Components never talk to storage directly.
 */
export function GameProvider({ services, children, fallback = null }: GameProviderProps) {
  const [boot, setBoot] = useState<BootResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    services.saveManager.loadOrCreateGame().then(
      (result) => {
        if (!cancelled) setBoot(result);
      },
      (error: unknown) => {
        // Storage failed completely: play without persistence rather than crash.
        console.error('[save] boot failed, starting an unsaved game', error);
        if (!cancelled) setBoot({ save: services.saveManager.createNewGame(), source: 'new' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [services.saveManager]);

  if (!boot) return <>{fallback}</>;
  return (
    <LoadedGame services={services} boot={boot}>
      {children}
    </LoadedGame>
  );
}

function LoadedGame({
  services,
  boot,
  children,
}: {
  services: GameServices;
  boot: BootResult;
  children: ReactNode;
}) {
  const [save, rawDispatch] = useReducer(gameReducer, boot.save);
  const lastPersisted = useRef(boot.save);

  useEffect(() => {
    if (save === lastPersisted.current) return;
    lastPersisted.current = save;
    services.saveManager.saveGame(save).catch((error: unknown) => {
      console.error('[save] autosave failed', error);
    });
  }, [save, services.saveManager]);

  useEffect(() => {
    services.audio.applySettings(save.settings.audio);
  }, [save.settings.audio, services.audio]);

  const dispatch = useCallback(
    (command: GameCommand) => {
      const action =
        command.type === 'save/replace'
          ? command
          : ({ ...command, at: services.clock.now().toISOString() } as GameAction);
      rawDispatch(action);
    },
    [services.clock],
  );

  const value = useMemo(
    () => ({ save, bootSource: boot.source, services, dispatch }),
    [save, boot.source, services, dispatch],
  );

  return <GameContext value={value}>{children}</GameContext>;
}
