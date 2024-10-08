import { useDiscordStore } from '@/lib/discord';
import { WebSocketStore, WebSocketStoreSet } from '.';

export async function connect(set: WebSocketStoreSet, get: () => WebSocketStore) {
  try {
    console.log(`[AdventureBoard WS] Connecting...`);

    const access_token = useDiscordStore.getState().auth?.access_token;
    if (!access_token) {
      console.error('[AdventureBoard WS] No access_token found');
      return;
    }

    const instanceId = useDiscordStore.getState().instanceId;
    if (!instanceId) {
      console.error('[AdventureBoard WS] No instanceId found');
      return;
    }

    let ws = new WebSocket(`wss://${location.host}/game/${instanceId}?access_token=${access_token}`);

    ws.addEventListener('open', () => {
      console.log(`[AdventureBoard WS] Connected`);
      set({ ws, exponentialBackoff: 1000 });
    });

    ws.addEventListener('message', (event: MessageEvent) => {
      console.log(`[WS] Message: ${event.data}`);
      const data = JSON.parse(event.data);
      if (data.type === 'connectionId') {
        set({ connectionId: data.connectionId });
      } else if (data.type === 'connections') {
        set({ connections: data.connections });
      }
    });

    ws.addEventListener('error', (error) => {
      console.error('[AdventureBoard WS] Error:', error);
    });

    ws.addEventListener('close', (event: CloseEvent) => {
      console.log(`[AdventureBoard WS] WebSocket connection closed. Code: ${event.code} Reason: ${event.reason}`);

      set({
        ws: null,
      });

      if (!event.wasClean) {
        // TODO: log error to sentry
      }

      retry(set, get);
    });
  } catch (error) {
    console.error('[AdventureBoard WS] Error:', error);
    retry(set, get);
  }
}

export async function retry(set: WebSocketStoreSet, get: () => WebSocketStore) {
  setTimeout(() => {
    set({ exponentialBackoff: get().exponentialBackoff * 2 });
    get().connect();
  }, get().exponentialBackoff);
}
