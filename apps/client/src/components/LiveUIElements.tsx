'use client';

import { useCallback, useEffect } from 'react';
import { throttle } from 'lodash';
import { LiveCursors } from './cursor/LiveCursors';
import { LiveUsers } from './users/LiveUsers';
import { useWebsocketStore } from '@/lib/websocket';
import { useEditor } from 'tldraw';

export function LiveUIElements() {
  const [_, updateMyPresence] = useWebsocketStore().useMyPresence();
  const editor = useEditor();

  const handlePointerMove = useCallback(
    throttle(
      (event: PointerEvent) => {
        const viewportBounds = editor.getViewportPageBounds();
        const x = event.clientX + viewportBounds.minX;
        const y = event.clientY + viewportBounds.minY;

        updateMyPresence({
          cursor: { x, y },
        });
      },
      1000 / 120,
      { leading: true },
    ),
    [updateMyPresence, editor],
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
