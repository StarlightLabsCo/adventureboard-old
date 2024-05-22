import { useWebsocketStore } from '@/lib/websocket';
import { Cursor } from './Cursor';

export function LiveCursors() {
  const others = useWebsocketStore().useOthersConnectionIds();

  return (
    <>
      {others.map((connectionId) => (
        <Cursor key={connectionId} connectionId={connectionId} />
      ))}
    </>
  );
}
