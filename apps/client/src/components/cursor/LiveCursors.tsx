import { useWebsocketStore } from '@/lib/websocket';
import { Cursor } from './Cursor';

export function LiveCursors() {
  const others = useWebsocketStore().useOthersConnectionIds();

  console.log('[LiveCursors] Others:', JSON.stringify(others));

  return (
    <>
      {others.map((connectionId) => (
        <Cursor key={connectionId} connectionId={connectionId} />
      ))}
    </>
  );
}
