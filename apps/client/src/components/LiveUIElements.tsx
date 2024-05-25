'use client';

import { useCallback, useEffect } from 'react';
import { throttle } from 'lodash';
import { LiveCursors } from './cursor/LiveCursors';
import { LiveUsers } from './users/LiveUsers';
import { useWebsocketStore } from '@/lib/websocket';
import { useTldrawStore } from '@/lib/tldraw';

export function LiveUIElements() {
  const [_, updateMyPresence] = useWebsocketStore().useMyPresence();

  const handlePointerMove = useCallback(
    throttle(
      (event: PointerEvent) => {
        const editor = useTldrawStore().editor;
        if (!editor) return;

        const viewportBounds = editor.getViewportPageBounds(); // TODO: get editor somehow
        const x = event.clientX + viewportBounds.minX;
        const y = event.clientY + viewportBounds.minY;

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
