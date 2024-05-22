import { create } from 'zustand';
import { useDiscordStore } from '@/lib/discord';
// import { validateWebSocketRequest, validateWebSocketResponse } from 'starlight-api-types/websocket';

// import { handleUserInfoResponse } from './handlers/userInfo';
// import { handleInstanceStatePatchResponse } from './handlers/instanceStatePatch';
// import { handleBufferAudioResponse } from './handlers/bufferAudio';
// import { handleErrorResponse } from './handlers/error';

// TODO: swap to yjs doc?

type WebSocketStore = {
  ws: WebSocket | null;
  connect: () => void;
  exponentialBackoff: number;
};

type WebSocketStoreSet = (arg0: { ws?: WebSocket | null; connect?: () => void; exponentialBackoff?: number }) => void;

export const useWebsocketStore = create<WebSocketStore>((set, get) => ({
  ws: null,
  connect: () => connect(set, get),
  exponentialBackoff: 250,
}));

async function connect(set: WebSocketStoreSet, get: () => WebSocketStore) {
  try {
    console.log(`[AdventureBoard WS] Connecting...`);

    const access_token = useDiscordStore.getState().auth?.access_token;
    const instanceId = useDiscordStore.getState().instanceId;

    if (!access_token) {
      console.error('[AdventureBoard WS] No access_token found');
      return;
    }

    if (!instanceId) {
      console.error('[AdventureBoard WS] No instanceId found');
      return;
    }

    let ws = new WebSocket(`wss://${location.host}/game/${instanceId}?access_token=${access_token}`);

    ws.onopen = () => {
      console.log(`[AdventureBoard WS] Connected`);
      set({ ws, exponentialBackoff: 1000 });
    };

    ws.onmessage = onMessage;

    ws.onerror = (error) => {
      console.error('[AdventureBoard WS] Error:', error);
    };

    ws.onclose = (event: CloseEvent) => {
      console.log(`[AdventureBoard WS] WebSocket connection closed. Code: ${event.code} Reason: ${event.reason}`);

      set({
        ws: null,
      });

      if (!event.wasClean) {
        // TODO: log error to sentry
      }

      retry(set, get);
    };
  } catch (error) {
    console.error('[AdventureBoard WS] Error:', error);
    retry(set, get);
  }
}

async function retry(set: WebSocketStoreSet, get: () => WebSocketStore) {
  setTimeout(() => {
    set({ exponentialBackoff: get().exponentialBackoff * 2 });
    get().connect();
  }, get().exponentialBackoff);
}

// export function sendMessage(message: string) {
//   console.log(`[WS] Sending message: ${message}`);

//   const ws = useWebsocketStore.getState().ws;
//   if (!ws) {
//     console.error('[WS] WebSocket connection not open');
//     return;
//   }

//   const request = validateWebSocketRequest(message);
//   if (!request) {
//     console.error('[WS] Invalid request:', message);
//     return;
//   }

//   ws.send(JSON.stringify(request));
// }

async function onMessage(event: MessageEvent) {
  console.log(`[WS] Message: ${event.data}`);

  // try {
  //   const response = validateWebSocketResponse(event.data);
  //   if (!response) return;

  //   const handler = handlers[response.type as keyof typeof handlers];
  //   if (!handler) {
  //     console.error('[WS] No handler for message type:', response.type);
  //     return;
  //   }

  //   await handler(response as any);
  // } catch (error) {
  //   console.error('[WS] Error parsing message:', error);
  // }
}

// const handlers = {};
