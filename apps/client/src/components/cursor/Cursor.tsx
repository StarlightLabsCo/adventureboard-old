'use client';

import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWebsocketStore } from '@/lib/websocket';
import { useTldrawStore } from '@/lib/tldraw';

const COLORS = ['#E57373', '#9575CD', '#4FC3F7', '#81C784', '#FFF176', '#FF8A65', '#F06292', '#7986CB'];

type Props = {
  connectionId: string;
};

function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// TODO: new bug presents itself i want the motion div to smooth the user motion as it's moving around, but I don't want it to apply when I'm moving the viewport around

function CursorComponent({ connectionId }: Props) {
  const connection = useWebsocketStore().useOther(connectionId);
  const cursor = connection?.presence.cursor;
  const editor = useTldrawStore().editor;

  if (!editor || !cursor) return null;

  const viewportBounds = editor.getViewportPageBounds();
  const colorIndex = hashStringToNumber(connectionId) % COLORS.length;
  const color = COLORS[colorIndex];

  const cursorPosition = cursor
    ? {
        x: cursor.x - viewportBounds.minX,
        y: cursor.y - viewportBounds.minY,
      }
    : { x: 0, y: 0 };

  return (
    <div
      key={connectionId}
      style={{
        position: 'absolute',
        top: cursorPosition.y,
        left: cursorPosition.x,
        opacity: 1,
      }}
    >
      <CursorSvg color={color} />
    </div>
  );
}

function CursorSvg({ color }: { color: string }) {
  return (
    <svg width="32" height="44" viewBox="0 0 24 36" fill="none">
      <path fill={color} d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" />
    </svg>
  );
}

export const Cursor = memo(CursorComponent);
