'use client';

import { useEffect, useRef, useState } from 'react';
import { useWebsocketStore } from '@/lib/websocket';
import { Presence } from 'adventureboard-ws-types';

// Tl draw
import {
  TLStoreWithStatus,
  Editor,
  TLEventInfo,
  throttle,
  TLStore,
  HistoryEntry,
  TLRecord,
  TLInstancePresence,
  createTLStore,
  defaultShapeUtils,
  InstancePresenceRecordType,
} from 'tldraw';
import { getAssetUrls } from '@tldraw/assets/selfHosted';
import 'tldraw/tldraw.css';

import dynamic from 'next/dynamic';
const Tldraw = dynamic(async () => (await import('tldraw')).Tldraw, { ssr: false });
const assetUrls = getAssetUrls();

export function SyncedCanvas() {
  const [store] = useState(() => createTLStore({ shapeUtils: [...defaultShapeUtils] }));
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({ status: 'loading' });
  const [editor, setEditor] = useState<Editor | null>(null);
  const presenceMap = useRef(new Map<string, TLInstancePresence>());

  const ws = useWebsocketStore().ws;

  useEffect(() => {
    if (!ws) return;

    setStoreWithStatus({
      status: 'synced-remote',
      connectionStatus: 'online',
      store,
    });

    // Setup websocket listeners
    const handleWebSocketMessage = (event: MessageEvent) => {
      const data = JSON.parse((event as MessageEvent).data);
      switch (data.type) {
        case 'init':
        case 'recovery':
          store.loadSnapshot(data.snapshot);
          break;
        case 'presence':
          handlePresence(store, editor, presenceMap, data.presence);
          break;
        case 'update':
          handleUpdates(store, data, ws);
          break;
      }
    };

    const handleClose = () => {
      setStoreWithStatus({
        status: 'synced-remote',
        connectionStatus: 'offline',
        store,
      });
    };

    ws.addEventListener('message', handleWebSocketMessage);
    ws.addEventListener('close', handleClose);

    return () => {
      ws.removeEventListener('message', handleWebSocketMessage);
      ws.removeEventListener('close', handleClose);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-[100vw] h-[100vh]">
      <Tldraw
        autoFocus
        inferDarkMode
        assetUrls={assetUrls}
        store={storeWithStatus}
        onMount={(editor) => {
          setEditor(editor);
          editor.on('event', (event) => {
            sendPresence(editor, event);
          });
        }}
      />
    </div>
  );
}

// Handling functions
const sendPresence = throttle((editor: Editor, event: TLEventInfo) => {
  if (event.name === 'pointer_move' && event.target === 'canvas') {
    const [_, updateMyPresence] = useWebsocketStore().useMyPresence();
    const { x, y } = event.point;
    updateMyPresence({ cursor: { x, y } });
  }
}, 1000 / 120);

const handlePresence = (
  store: TLStore,
  editor: Editor | null,
  presenceMapRef: React.RefObject<Map<string, TLInstancePresence>>,
  data: { connectionId: string; presence: Presence },
) => {
  if (!editor) return;

  const { connectionId, presence } = data;
  const { cursor } = presence;

  let peerPresence = presenceMapRef.current!.get(connectionId);
  if (!peerPresence) {
    peerPresence = {
      id: InstancePresenceRecordType.createId(store.id),
      currentPageId: editor.getCurrentPageId(),
      userId: connectionId,
      userName: 'Placeholder',
      cursor: { x: cursor?.x ?? 0, y: cursor?.y ?? 0, type: 'default', rotation: 0 },
    } as TLInstancePresence;
    presenceMapRef.current!.set(connectionId, peerPresence);
    store.put([peerPresence]);
  } else {
    store.put([
      {
        ...peerPresence,
        cursor: { x: cursor?.x ?? 0, y: cursor?.y ?? 0, type: 'default', rotation: 0 },
        lastActivityTimestamp: Date.now(),
      },
    ]);
  }
};

const handleUpdates = (store: TLStore, data: { updates: HistoryEntry<TLRecord>[] }, ws: WebSocket) => {
  const { updates } = data;
  try {
    updates.forEach((update) => {
      store.mergeRemoteChanges(() => {
        const { added, updated, removed } = update.changes;
        store.put(Object.values(added));
        store.put(Object.values(updated).map(([, to]) => to));
        store.remove(Object.values(removed).map((record) => record.id));
      });
    });
  } catch (e) {
    console.error(e);
    ws.send(JSON.stringify({ type: 'recovery' }));
  }
};
