import { TLPageId, track, useEditor } from 'tldraw';
import { useWebsocketStore } from '@/lib/websocket';
import { useTldrawStore } from '@/lib/tldraw';

export const MovePlayersPanel = track(() => {
  const editor = useEditor();
  const { ws } = useWebsocketStore.getState();

  const playersPageId = useTldrawStore((state) => state.gameState.currentPageId);
  const playersPage = editor.getPage(playersPageId as TLPageId);

  const handleTransition = () => {
    if (!ws) return;

    const newGameState = {
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

  if (editor.getCurrentPageId() !== playersPageId) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-primary-foreground">Players are currently viewing {playersPage?.name}</div>
        <div
          onClick={handleTransition}
          className="px-4 py-2 text-white pointer-events-auto bg-red-500 text-sm font-bold rounded-md cursor-pointer hover:bg-red-400"
        >
          Transition
        </div>
      </div>
    );
  } else {
    return null;
  }
});
