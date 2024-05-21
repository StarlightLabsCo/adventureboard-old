'use client';

import { useEffect } from 'react';
import { setupDiscordSDK, useDiscordStore } from '@/lib/discord';
import { useWebsocketStore } from '@/lib/websocket';

import { SyncedCanvas } from '@/components/canvas/SyncedCanvas';
import { LiveUIElements } from '@/components/LiveUIElements';
import { CommandMenu } from '@/components/menu/command';

export default function Page() {
  const auth = useDiscordStore((state) => state.auth);
  const connect = useWebsocketStore((state) => state.connect);

  useEffect(() => {
    setupDiscordSDK();
  }, []);

  useEffect(() => {
    if (auth != null) {
      connect();
    }
  }, [connect, auth]);

  return (
    <>
      <SyncedCanvas />
      <LiveUIElements />
      <CommandMenu />
    </>
  );
}
