import { TLPageId, track, useEditor } from 'tldraw';
import { useWebsocketStore } from '@/lib/websocket';
import { useTldrawStore } from '@/lib/tldraw';

export const MovePlayersPanel = track(() => {
  const editor = useEditor();
  const { ws } = useWebsocketStore.getState();

  const playersPageId = useTldrawStore.getState().gameState.currentPageId;
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

  if (editor.getCurrentPageId().toString() !== useTldrawStore.getState().gameState.currentPageId) {
    return (
      <div className="flex flex-col items-center">
        <div className="text-foreground">Players are currently viewing {playersPage?.name}</div>
        <div onClick={handleTransition} className="px-2 py-1 text-white pointer-events-auto bg-red-400 text-sm rounded-sm">
          Transition
        </div>
      </div>
    );
  } else {
    return null;
  }
});
