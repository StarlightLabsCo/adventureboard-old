import { memo } from 'react';
import { motion } from 'framer-motion';
import { useWebsocketStore } from '@/lib/websocket';

//
// RATIONALE:
// Each cursor itself subscribes to _just_ the change for the user. This
// means that if only one user's cursor is moving, only one <Cursor />
// component has to re-render. All the others can remain idle.
//

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

function CursorComponent({ connectionId }: Props) {
  const cursor = useWebsocketStore().useOther(connectionId, (user) => user.presence.cursor);
  if (!cursor) {
    return null;
  }

  const { x, y } = cursor;
  const colorIndex = hashStringToNumber(connectionId) % COLORS.length;
  const color = COLORS[colorIndex];

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
      }}
      initial={{ x, y }}
      animate={{ x, y }}
      transition={{
        type: 'spring',
        damping: 30,
        mass: 0.8,
        stiffness: 350,
      }}
    >
      <CursorSvg color={color} />
    </motion.div>
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
