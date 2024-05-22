import { create } from 'zustand';
import { Connections, Connection, Presence } from 'adventureboard-ws-types';
import { connect } from './connection';

export type WebSocketStore = {
  ws: WebSocket | null;
  connect: () => void;
  exponentialBackoff: number;

  connectionId: string | null;
  connections: Connections;
  myPresence: Presence | undefined;
  useSelf: () => Connection | undefined;
  useMyPresence: () => [Presence | undefined, (presence: Presence) => void];

  useOthers: () => Connection[];
  useOthersConnectionIds: () => string[];
  useOther: <T>(connectionId: string, selector: (conn: Connection) => T) => T | undefined;
};

export type WebSocketStoreSet = (partial: Partial<WebSocketStore>) => void;

export const useWebsocketStore = create<WebSocketStore>((set, get) => ({
  ws: null,
  connect: () => connect(set, get),
  exponentialBackoff: 250,

  connectionId: null,
  connections: {},
  myPresence: undefined,

  // Selectors
  useSelf: () => {
    const connectionId = get().connectionId;
    return connectionId ? get().connections[connectionId] : undefined;
  },

  // TODO: for some reason this is returning undefined , () => {} and then doesn't update later? need to fix the reactivity of it.
  useMyPresence: () => {
    const connectionId = get().connectionId;
    if (!connectionId) return [undefined, () => {}];

    return [
      get().connections[connectionId]?.presence,
      (presence: Presence) => {
        set((state) => {
          state.connections[connectionId].presence = presence;
          return { connections: state.connections };
        });

        const ws = get().ws;
        if (ws) {
          ws.send(JSON.stringify({ type: 'presence', presence }));
        }
      },
    ];
  },

  useOthers: () => {
    const connectionId = get().connectionId;
    return Object.values(get().connections).filter((conn) => conn.connectionId !== connectionId);
  },

  useOthersConnectionIds: () => {
    const connectionId = get().connectionId;
    return Object.keys(get().connections).filter((conn) => conn !== connectionId);
  },

  useOther: <T>(connectionId: string, selector: (conn: Connection) => T) => {
    const connection = get().connections[connectionId];
    return connection ? selector(connection) : undefined;
  },
}));
