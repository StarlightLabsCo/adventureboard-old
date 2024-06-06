interface Connections {
  [connectionId: string]: Connection;
}

interface Connection {
  connectionId: string;
  discordUser: { id: string; username: string; global_name: string | null; avatar: string | null; discriminator: string };
  isHost: boolean;
  presence: Presence;
}

interface Presence {
  pageId: string;
  cursor: { x: number; y: number } | null;
  // Add other presence-related fields here
}

interface GameState {
  currentPageId: string;
}

export type { Connections, Connection, Presence, GameState };
