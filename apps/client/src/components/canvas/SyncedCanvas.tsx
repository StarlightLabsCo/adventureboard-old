'use client';

import { useEffect, useState } from 'react';
import { throttle } from 'lodash';
import { useWebsocketStore } from '@/lib/websocket';

// Tldraw
import dynamic from 'next/dynamic';
import { createTLStore, TLStoreWithStatus, defaultShapeUtils, HistoryEntry, TLRecord } from 'tldraw';
import { getAssetUrls } from '@tldraw/assets/selfHosted';
import 'tldraw/tldraw.css';

const assetUrls = getAssetUrls();
const Tldraw = dynamic(async () => (await import('tldraw')).Tldraw, { ssr: false });

export function SyncedCanvas() {
  const [store] = useState(() => createTLStore({ shapeUtils: [...defaultShapeUtils] }));
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({ status: 'loading' });
  const ws = useWebsocketStore((state) => state.ws);

  useEffect(() => {
    // Websocket bindings
    if (!ws) return;

    setStoreWithStatus({
      status: 'synced-remote',
      connectionStatus: 'online',
      store,
    });

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'init':
        case 'recovery':
          store.loadSnapshot(data.snapshot);
          break;
        case 'update':
          try {
            data.updates.forEach((update: HistoryEntry<TLRecord>) => {
              store.mergeRemoteChanges(() => {
                const { added, updated, removed } = update.changes;
                store.put(Object.values(added));
                store.put(Object.values(updated).map(([, to]) => to));
                store.remove(Object.values(removed).map((record) => record.id));
              });
            });
          } catch (e) {
            console.error(e);
            ws.send(
              JSON.stringify({
                type: 'recovery',
              }),
            );
          }
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

    ws.addEventListener('message', handleMessage);
    ws.addEventListener('close', handleClose);

    // Tldraw store listener
    let pendingChanges: HistoryEntry<TLRecord>[] = [];

    const sendChanges = throttle(() => {
      if (pendingChanges.length === 0) return;
      ws.send(JSON.stringify({ type: 'update', updates: pendingChanges }));
      pendingChanges = [];
    }, 32);

    const handleChange = (event: HistoryEntry<TLRecord>) => {
      if (event.source !== 'user') return;
      pendingChanges.push(event);
      sendChanges();
    };

    const unsubscribe = store.listen(handleChange, { source: 'user', scope: 'document' });

    // Cleanup
    return () => {
      unsubscribe();
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('close', handleClose);
    };
  }, [ws, store]);

  return (
    <div className="fixed inset-0 w-[100vw] h-[100vh]">
      <Tldraw autoFocus inferDarkMode assetUrls={assetUrls} store={storeWithStatus} />
    </div>
  );
}
