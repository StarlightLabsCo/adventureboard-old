import { useState } from 'react';
import { useGameStore } from '@/lib/game';
import { GameSystem } from 'adventureboard-ws-types';
import { useWebsocketStore } from '@/lib/websocket';

export function SystemSelectDialog() {
  const [selectedSystem, setSelectedSystem] = useState<GameSystem | null>(null);

  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);

  const ws = useWebsocketStore((state) => state.ws);

  const systems: GameSystem[] = ['d&d5e', 'pathfinder', 'daggerheart', 'other'];

  const handleSelectSystem = (system: GameSystem) => {
    setSelectedSystem(system);
  };

  const handleStartGame = () => {
    if (selectedSystem) {
      setGameState({ ...gameState, system: selectedSystem });

      if (ws) {
        ws.send(
          JSON.stringify({
            type: 'gameState',
            gameState: useGameStore.getState().gameState,
          }),
        );
      }
    }
  };

  return (
    <div className="absolute top-0 left-0 w-screen h-screen bg-black/50 z-[1000] flex items-center justify-center backdrop-blur-sm">
      <div className="w-3/4 h-3/4 shrink-0 bg-white rounded-[30px] flex flex-col items-center">
        <h1 className="text-[var(--color-text-0)]">Select a system</h1>
        <div className="flex justify-evenly items-center gap-x-5 w-full h-full px-2">
          {systems.map((system) => (
            <div
              key={system}
              className="relative w-full flex flex-col rounded-md hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => handleSelectSystem(system)}
            >
              <img src={`/covers/${system}.webp`} className="rounded-md hover:scale-105 transition-all duration-300" />
              {selectedSystem !== system && selectedSystem !== null && <div className="absolute inset-0 bg-black/50 z-[1001]" />}
            </div>
          ))}
        </div>
        <div className="w-full flex justify-center items-center">
          <div className="w-full h-full flex justify-center items-center cursor-pointer" onClick={handleStartGame}>
            Start
          </div>
        </div>
      </div>
    </div>
  );
}
