'use client';

import { useCallback } from 'react';
import { LiveCursors } from './cursor/LiveCursors';
import { LiveUsers } from './users/LiveUsers';
import { useWebsocketStore } from '@/lib/websocket';

export function LiveUIElements() {
  const [_, updateMyPresence] = useWebsocketStore().useMyPresence();
  console.log(`updateMyPresence: ${updateMyPresence}`);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      console.log(`handlePointerMove`);
      event.preventDefault();

      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      console.log(`x: ${x}, y: ${y}`);
      updateMyPresence({
        cursor: { x, y },
      });
    },
    [updateMyPresence],
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({
      cursor: null,
    });
  }, [updateMyPresence]);

  return (
    <div className="absolute top-0  h-[100vh] w-[100vw] z-10" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <LiveUsers />
      <LiveCursors />
    </div>
  );
}
