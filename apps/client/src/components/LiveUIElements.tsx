'use client';

import { useCallback } from 'react';
import { throttle } from 'lodash';
import { LiveCursors } from './cursor/LiveCursors';
import { LiveUsers } from './users/LiveUsers';
import { useWebsocketStore } from '@/lib/websocket';

export function LiveUIElements() {
  const [_, updateMyPresence] = useWebsocketStore().useMyPresence();

  const handlePointerMove = useCallback(
    throttle(
      (event: React.PointerEvent) => {
        event.preventDefault();

        const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

        updateMyPresence({
          cursor: { x, y },
        });
      },
      1000 / 120, // Throttle to 120 updates per second
      { leading: true, trailing: true },
    ),
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
