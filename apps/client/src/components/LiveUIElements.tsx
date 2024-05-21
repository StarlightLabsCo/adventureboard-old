'use client';

import { useCallback } from 'react';
import { useMyPresence } from '@liveblocks-config';
import { LiveCursors } from './cursor/LiveCursors';
import { LiveUsers } from './users/LiveUsers';

export function LiveUIElements() {
  const [_, updateMyPresence] = useMyPresence();

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();

      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

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
