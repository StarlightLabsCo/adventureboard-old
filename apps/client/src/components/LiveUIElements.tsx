'use client';

import { useCallback, useEffect } from 'react';
import { throttle } from 'lodash';
import { LiveCursors } from './cursor/LiveCursors';
import { LiveUsers } from './users/LiveUsers';
import { useWebsocketStore } from '@/lib/websocket';

export function LiveUIElements() {
  const [_, updateMyPresence] = useWebsocketStore().useMyPresence();

  const handlePointerMove = useCallback(
    throttle(
      (event: PointerEvent) => {
        const x = event.clientX;
        const y = event.clientY;

        updateMyPresence({
          cursor: { x, y },
        });
      },
      1000 / 120,
      { leading: true },
    ),
    [updateMyPresence],
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({
      cursor: null,
    });
  }, [updateMyPresence]);

  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [handlePointerMove, handlePointerLeave]);

  return (
    <>
      <LiveUsers />
      <LiveCursors />
    </>
  );
}
