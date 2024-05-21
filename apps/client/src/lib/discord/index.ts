import { DiscordSDK } from '@discord/embedded-app-sdk';
import { create } from 'zustand';
import { authenticate, Auth } from './auth';

if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('DISCORD_CLIENT_ID is not set');
}

// ---- Store ----
type DiscordStore = {
  instanceId: string | null;
  setInstanceId: (instanceId: string | null) => void;
  auth: Auth | null;
  setAuth: (auth: Auth | null) => void;
};

const useDiscordStore = create<DiscordStore>((set) => ({
  instanceId: null,
  setInstanceId: (instanceId: string | null) => set({ instanceId }),
  auth: null,
  setAuth: (auth: Auth | null) => set({ auth }),
}));

const discordSdk = new DiscordSDK(process.env.DISCORD_CLIENT_ID);

useDiscordStore.getState().setInstanceId(discordSdk.instanceId);

async function setupDiscordSDK() {
  await discordSdk.ready();
  await discordSdk.commands.encourageHardwareAcceleration();

  const auth = await authenticate();
  useDiscordStore.getState().setAuth(auth);
}

export { setupDiscordSDK, discordSdk as default, useDiscordStore };
