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

  const handleStartGame = () => {
    if (selectedSystem) {
      setGameState({ ...gameState, system: selectedSystem });

      if (ws) {
        ws.send(
          JSON.stringify({
            type: 'gameState',
            gameState: {
              ...gameState,
              system: selectedSystem,
            },
          }),
        );
      }
    }
  };

  return (
    <div className="absolute top-0 left-0 w-screen h-screen bg-black/50 z-[1000] flex items-center justify-center backdrop-blur-sm">
      <div className="w-3/4 h-3/4 shrink-0 rounded-[30px] flex flex-col items-center bg-[var(--color-background)] text-[var(--color-text-0)] px-4 py-2">
        <div className="flex w-full justify-between items-center gap-x-4">
          <div className="w-full h-[1px] bg-[var(--color-overlay)] rounded-full" />
          <h1 className="text-[var(--color-text-0)] text-lg font-bold shrink-0">Select a system</h1>
          <div className="w-full h-[1px] bg-[var(--color-overlay)] rounded-full" />
        </div>
        <div className="flex justify-evenly items-center gap-x-5 w-full h-full px-2">
          {systems.map((system) => (
            <div
              key={system}
              className="relative w-full flex flex-col rounded-md hover:scale-105 transition-all duration-300 cursor-pointer shadow-[var(--shadow-2)]"
              onClick={() => setSelectedSystem(system)}
            >
              <img src={`/covers/${system}.webp`} className="rounded-md hover:scale-105 transition-all duration-300" />
              {selectedSystem !== system && selectedSystem !== null && (
                <div className="absolute inset-0 bg-[var(--color-overlay)] z-[1001]" />
              )}
            </div>
          ))}
        </div>
        <div className="w-full flex justify-center items-center">
          <div
            className={`px-4 py-2 rounded-full h-full flex justify-center items-center cursor-pointer ${selectedSystem ? 'bg-[var(--color-primary)] text-[var(--color-text-0)]' : 'bg-[var(--color-muted-1)] text-[var(--color-muted-2)] cursor-not-allowed'}`}
            onClick={selectedSystem ? handleStartGame : undefined}
          >
            Start
          </div>
        </div>
      </div>
    </div>
  );
}
