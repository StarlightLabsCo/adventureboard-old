interface Connections {
  [connectionId: string]: Connection;
}

interface Connection {
  connectionId: string;
  isHost: boolean;
  presence: Presence;
}

interface Presence {
  cursor: { x: number; y: number } | null;
  // Add other presence-related fields here
}

export type { Connections, Connection, Presence };
