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

    ws.onopen = () => {
      console.log(`[AdventureBoard WS] Connected`);
      set({ ws, exponentialBackoff: 1000 });
    };

    ws.onmessage = (event: MessageEvent) => {
      console.log(`[WS] Message: ${event.data}`);
      // Handle incoming messages
    };

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

export async function retry(set: WebSocketStoreSet, get: () => WebSocketStore) {
  setTimeout(() => {
    set({ exponentialBackoff: get().exponentialBackoff * 2 });
    get().connect();
  }, get().exponentialBackoff);
}
