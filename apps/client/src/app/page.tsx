'use client';

import { useEffect } from 'react';
import { setupDiscordSDK, useDiscordStore } from '@/lib/discord';
import { useWebsocketStore } from '@/lib/websocket';

import { SyncedCanvas } from '@/components/canvas/SyncedCanvas';
import { LiveUIElements } from '@/components/LiveUIElements';
import { CommandMenu } from '@/components/menu/command';
import { Loading } from '@/components/Loading';

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

  if (auth == null) {
    return <Loading />;
  }

  return (
    <>
      <SyncedCanvas />
      <LiveUIElements />
      <CommandMenu />
    </>
  );
}
