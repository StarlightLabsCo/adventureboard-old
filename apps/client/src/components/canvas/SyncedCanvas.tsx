'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const editorRef = useRef<Editor | null>(null);
  const presenceMap = useRef(new Map<string, TLInstancePresence>());
  let pendingChanges: HistoryEntry<TLRecord>[] = [];

  const ws = useWebsocketStore().ws;

  const handleWebSocketMessage = useCallback(
    (event: MessageEvent) => {
      const data = JSON.parse((event as MessageEvent).data);
      switch (data.type) {
        case 'init':
        case 'recovery':
          store.loadSnapshot(data.snapshot);
          break;
        case 'presence':
          handlePresence(store, editorRef, presenceMap, data);
          break;
        case 'update':
          handleUpdates(store, data, ws);
          break;
      }
    },
    [store, editorRef, presenceMap, ws],
  );

  const handleClose = () => {
    setStoreWithStatus({
      status: 'synced-remote',
      connectionStatus: 'offline',
      store,
    });
  };

  useEffect(() => {
    if (!ws) return;

    setStoreWithStatus({
      status: 'synced-remote',
      connectionStatus: 'online',
      store,
    });

    ws.addEventListener('message', handleWebSocketMessage);
    ws.addEventListener('close', handleClose);

    const unsubscribe = store.listen(
      (change: HistoryEntry<TLRecord>) => {
        if (change.source !== 'user') return;
        pendingChanges.push(change);
        sendChanges(pendingChanges);
      },
      { source: 'user', scope: 'document' },
    );

    return () => {
      ws.removeEventListener('message', handleWebSocketMessage);
      ws.removeEventListener('close', handleClose);

      unsubscribe();
    };
  }, [ws]);

  return (
    <div className="fixed inset-0 w-[100vw] h-[100vh]">
      <Tldraw
        autoFocus
        inferDarkMode
        assetUrls={assetUrls}
        store={storeWithStatus}
        onMount={(editor) => {
          editorRef.current = editor;
          editor.on('event', (event) => {
            sendPresence(event);
          });
        }}
      />
    </div>
  );
}

// ----- Handling functions -----
const sendChanges = throttle((pendingChanges: HistoryEntry<TLRecord>[]) => {
  if (pendingChanges.length === 0) return;

  const ws = useWebsocketStore.getState().ws;
  if (!ws) return;

  ws.send(JSON.stringify({ type: 'update', updates: pendingChanges }));

  pendingChanges.splice(0, pendingChanges.length);
}, 32);

const sendPresence = throttle((event: TLEventInfo) => {
  if (event.name === 'pointer_move' && event.target === 'canvas') {
    const [_, updateMyPresence] = useWebsocketStore.getState().useMyPresence();
    const { x, y } = event.point;
    updateMyPresence({ cursor: { x, y } });
  }
}, 1000 / 120);

const handlePresence = (
  store: TLStore,
  editorRef: React.RefObject<Editor | null>,
  presenceMapRef: React.RefObject<Map<string, TLInstancePresence>>,
  data: { connectionId: string; presence: Presence },
) => {
  const editor = editorRef.current;
  if (!editor) return;

  const { connectionId, presence } = data;
  const { cursor } = presence;

  if (!presenceMapRef.current) {
    console.log('[SyncedCanvas] Presence map not initialized');
    return;
  }
  let peerPresence = presenceMapRef.current.get(connectionId);

  if (!peerPresence) {
    peerPresence = InstancePresenceRecordType.create({
      id: InstancePresenceRecordType.createId(store.id),
      currentPageId: editor.getCurrentPageId(),
      userId: connectionId,
      userName: 'Placeholder',
      cursor: { x: cursor?.x ?? 0, y: cursor?.y ?? 0, type: 'default', rotation: 0 },
    });
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

const handleUpdates = (store: TLStore, data: { updates: HistoryEntry<TLRecord>[] }, ws: WebSocket | null) => {
  if (!ws) return;

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
