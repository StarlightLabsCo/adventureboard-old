'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebsocketStore } from '@/lib/websocket';
import { GameState, Presence } from 'adventureboard-ws-types';

// Tl draw
import {
  TLStoreWithStatus,
  Editor,
  throttle,
  TLStore,
  HistoryEntry,
  TLRecord,
  TLInstancePresence,
  createTLStore,
  defaultShapeUtils,
  InstancePresenceRecordType,
  TLAsset,
  TLAssetId,
  AssetRecordType,
  getHashForString,
  MediaHelpers,
  TLPointerEventInfo,
  TLUiOverrides,
  TLPageId,
  TLUiAssetUrlOverrides,
} from 'tldraw';
import { getAssetUrls } from '@tldraw/assets/selfHosted';
import 'tldraw/tldraw.css';

import dynamic from 'next/dynamic';
import { useDiscordStore } from '@/lib/discord';
import { DMToolbar } from './tools/DMToolbar';
import { SharePanel } from './panels/SharePanel';
import { StylePanel } from './panels/StylePanel';
import { MovePlayersPanel } from './panels/MovePlayersPanel';
import { ImageGenTool } from './tools/ImageGenTool';
import { DMKeyboardShortcutDialog } from './tools/DMKeyboardShortcutDialog';
import { OutpaintSelectionUI } from './OutpaintSelectionUI';
import { SystemSelectDialog } from '../ui/SystemSelectDialog';
const Tldraw = dynamic(async () => (await import('tldraw')).Tldraw, { ssr: false });
const assetUrls = getAssetUrls();

const overrides: TLUiOverrides = {
  translations: {
    en: {
      'page-menu.title': 'Scenes',
      'page-menu.new-page-initial-name': 'Scene',
    },
  },
  tools(editor, tools) {
    tools.imageGen = {
      id: 'imageGen',
      icon: 'magic-wand',
      label: 'Image Gen',
      kbd: 'g',
      onSelect: () => {
        editor.setCurrentTool('imageGen');
      },
    };
    return tools;
  },
};

const assetOverrides: TLUiAssetUrlOverrides = {
  ...assetUrls,
  icons: {
    ...assetUrls.icons,
    'magic-wand': '/icons/icon/magic-wand.svg',
    upload: '/icons/icon/upload.svg',
  },
};

export function SyncedCanvas() {
  const [store] = useState(() => createTLStore({ shapeUtils: [...defaultShapeUtils] }));
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({ status: 'loading' });
  const editorRef = useRef<Editor | null>(null);
  const [components, setComponents] = useState({});

  const presenceMap = useRef(new Map<string, TLInstancePresence>());
  let pendingChanges: HistoryEntry<TLRecord>[] = [];

  const [gameState, setGameState] = useState<GameState>({
    system: null,
    currentPageId: 'page:page',
  });

  const ws = useWebsocketStore().ws;
  const self = useWebsocketStore().useSelf();

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
        case 'gameState':
          setGameState(data.gameState);
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

  useEffect(() => {
    if (!editorRef.current) return;

    if (editorRef.current.getCurrentPageId() !== gameState.currentPageId) {
      editorRef.current.setCurrentPage(gameState.currentPageId as TLPageId);
    }
  }, [gameState]);

  const TldrawMemoized = useMemo(() => {
    const customTools = [ImageGenTool];

    return (
      <Tldraw
        autoFocus
        inferDarkMode
        tools={customTools}
        overrides={overrides}
        assetUrls={assetOverrides}
        store={storeWithStatus}
        onMount={(editor) => {
          editorRef.current = editor;

          editor.on('event', (event) => {
            // TODO: handle laser pointer and stuff so it's visible
            if (event.name === 'pointer_move' && event.target === 'canvas') {
              sendPresence(editor, event);
            }
          });

          const isHost = useWebsocketStore.getState().useSelf()?.isHost;
          if (!isHost) {
            editor.updateInstanceState({ isReadonly: true });
            setComponents({ PageMenu: null, SharePanel: SharePanel, StylePanel: StylePanel });
          } else {
            setComponents({
              Toolbar: DMToolbar,
              KeyboardShortcutsDialog: DMKeyboardShortcutDialog,
              SharePanel: SharePanel,
              StylePanel: StylePanel, // TODO: create custom style panel for ImageGenTool
              TopPanel: MovePlayersPanel,
              InFrontOfTheCanvas: OutpaintSelectionUI,
            });
          }

          editor.registerExternalAssetHandler('file', uploadFile);
        }}
        components={components}
      />
    );
  }, [storeWithStatus, components]);

  if (!self) {
    return <div>Not connected</div>;
  }

  return (
    <div className="fixed inset-0 w-[100vw] h-[100vh]">
      {!gameState.system && <SystemSelectDialog />}
      {TldrawMemoized}
    </div>
  );
}

// ----- Handling functions -----

// Updates
const sendChanges = throttle((pendingChanges: HistoryEntry<TLRecord>[]) => {
  if (pendingChanges.length === 0) return;

  const ws = useWebsocketStore.getState().ws;
  if (!ws) return;

  ws.send(JSON.stringify({ type: 'update', updates: pendingChanges }));

  pendingChanges.splice(0, pendingChanges.length);
}, 32);

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

// Presence
const sendPresence = throttle((editor: Editor, event: TLPointerEventInfo) => {
  const [_, updateMyPresence] = useWebsocketStore.getState().useMyPresence();
  const { x, y } = editor.screenToPage(event.point);

  updateMyPresence({ cursor: { x, y }, pageId: editor.getCurrentPageId() });
}, 1000 / 120);

const handlePresence = (
  store: TLStore,
  editorRef: React.RefObject<Editor | null>,
  presenceMapRef: React.RefObject<Map<string, TLInstancePresence>>,
  data: { connectionId: string; presence: Presence },
) => {
  if (!editorRef.current) {
    console.log('[SyncedCanvas] Editor not initialized');
    return;
  }

  if (!presenceMapRef.current) {
    console.log('[SyncedCanvas] Presence map not initialized');
    return;
  }

  const { connectionId, presence } = data;
  const { cursor, pageId } = presence;

  let peerPresence = presenceMapRef.current.get(connectionId);
  if (!peerPresence) {
    const connection = useWebsocketStore.getState().connections[connectionId];
    if (!connection) {
      console.log('[SyncedCanvas] Connection not found');
      return;
    }

    peerPresence = InstancePresenceRecordType.create({
      id: InstancePresenceRecordType.createId(store.id),
      currentPageId: pageId as TLPageId,
      userId: connectionId,
      userName: connection.discordUser.global_name || connection.discordUser.username,
      cursor: { x: cursor?.x ?? 0, y: cursor?.y ?? 0, type: 'default', rotation: 0 },
    });

    presenceMapRef.current.set(connectionId, peerPresence);
  } else {
    peerPresence = {
      ...peerPresence,
      currentPageId: pageId as TLPageId,
      cursor: { x: cursor?.x ?? 0, y: cursor?.y ?? 0, type: 'default', rotation: 0 },
      lastActivityTimestamp: Date.now(),
    };
  }

  store.put([peerPresence]);
};

// Asset upload
const uploadFile = async (info: { file: File; type: 'file' }): Promise<TLAsset> => {
  const { file } = info;
  const accessToken = useDiscordStore.getState().auth?.access_token;

  if (!accessToken) {
    throw new Error('Unauthorized');
  }

  // Fetch presigned URL from /api/file
  const presignedUrlResponse = await fetch('/api/file', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ filename: file.name }),
  });

  if (!presignedUrlResponse.ok) {
    throw new Error('Failed to get presigned URL');
  }

  const { url } = await presignedUrlResponse.json();

  // Need to map for discord sandbox (need to update URL mapping if this changes anywhere cause it's hardcoded there)
  const mappedUrl = url.replace(
    new RegExp(
      `^https://${process.env.NEXT_PUBLIC_R2_BUCKET_NAME}\\.${process.env.NEXT_PUBLIC_R2_ACCOUNT_ID}\\.r2\\.cloudflarestorage\\.com`,
    ),
    '/r2-upload',
  );

  // Upload the file to the presigned URL
  const uploadResponse = await fetch(mappedUrl, {
    method: 'PUT',
    body: file,
  });

  if (!uploadResponse.ok) {
    console.error(uploadResponse);
    throw new Error('Failed to upload file');
  }

  // Create a TLAsset object
  const assetId: TLAssetId = AssetRecordType.createId(getHashForString(url));
  let size: { w: number; h: number };
  let isAnimated: boolean;
  let shapeType: 'image' | 'video';

  if (MediaHelpers.isImageType(file.type)) {
    shapeType = 'image';
    size = await MediaHelpers.getImageSize(file);
    isAnimated = await MediaHelpers.isAnimated(file);
  } else {
    shapeType = 'video';
    isAnimated = true;
    size = await MediaHelpers.getVideoSize(file);
  }

  const assetUrl = mappedUrl.replace('/r2-upload', '/r2-get').split('?')[0];
  const asset: TLAsset = AssetRecordType.create({
    id: assetId,
    type: shapeType,
    typeName: 'asset',
    props: {
      name: file.name,
      src: assetUrl,
      w: size.w,
      h: size.h,
      mimeType: file.type,
      isAnimated,
    },
  });

  return asset;
};
