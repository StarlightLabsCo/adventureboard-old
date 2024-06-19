import { TLPageId, track, useEditor } from 'tldraw';
import { useWebsocketStore } from '@/lib/websocket';
import { useTldrawStore } from '@/lib/tldraw';

export const MovePlayersPanel = track(() => {
  const editor = useEditor();
  const { ws } = useWebsocketStore.getState();

  const connections = useWebsocketStore((state) => state.connections);

  const playersPageId = useTldrawStore((state) => state.gameState.currentPageId);
  const playersPage = editor.getPage(playersPageId as TLPageId);

  const handleTransition = () => {
    if (!ws) return;

    const newGameState = {
      system: null, // TODO: fix
      currentPageId: editor.getCurrentPageId(),
    };

    useTldrawStore.setState({ gameState: newGameState });

    ws.send(
      JSON.stringify({
        type: 'gameState',
        gameState: newGameState,
      }),
    );
  };

  if (editor.getCurrentPageId() !== playersPageId && Object.keys(connections).length > 1) {
    return (
      <div className="flex flex-col items-center">
        <div
          className="font-medium drop-shadow-md"
          style={{
            color: 'var(--color-text-0)',
          }}
        >
          Players are currently viewing Scene: {playersPage?.name}
        </div>
        <div
          onClick={handleTransition}
          className="px-4 py-2 text-white pointer-events-auto bg-red-500 text-sm font-bold rounded-[var(--radius-4)] cursor-pointer hover:bg-red-400"
        >
          Summon
        </div>
      </div>
    );
  } else {
    return null;
  }
});
