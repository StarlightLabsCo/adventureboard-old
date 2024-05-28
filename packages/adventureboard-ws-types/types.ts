interface Connections {
  [connectionId: string]: Connection;
}

interface Connection {
  connectionId: string;
  discordUser: { id: string; username: string; global_name: string; avatar: string | null; discriminator: string };
  isHost: boolean;
  presence: Presence;
}

interface Presence {
  cursor: { x: number; y: number } | null;
  // Add other presence-related fields here
}

export type { Connections, Connection, Presence };
