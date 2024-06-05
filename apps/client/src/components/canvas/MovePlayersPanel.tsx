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

  if (editor.getCurrentPageId() !== useTldrawStore.getState().gameState.currentPageId) {
    return (
      <div className='flex flex-col items-center'>
        <div className='text-foreground'>Players are currently on {playersPage?.name}</div>
        <button onClick={handleTransition} className="tlui-button tlui-button__normal" style={{ backgroundColor: 'red' }}>
          <span className="tlui-button__label">Transition</span>
        </button>
      </div>
    );
  } else {
    return null;
  }
});
