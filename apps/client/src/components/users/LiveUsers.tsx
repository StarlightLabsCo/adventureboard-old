import React from 'react';
import { Avatar } from './Avatar';
import { useWebsocketStore } from '@/lib/websocket';

function LiveUsersComponent() {
  const users = useWebsocketStore().useOthers();
  const currentUser = useWebsocketStore().useSelf();
  const hasMoreUsers = users.length > 3;

  const getDefaultAvatarIndex = (id: string, discriminator: string) => {
    const isMigratedUser = discriminator === '0';
    return isMigratedUser ? (BigInt(id) >> BigInt(22)) % BigInt(6) : parseInt(discriminator) % 5;
  };

  return (
    <div className="h-full flex gap-x-1 z-10 items-center">
      {currentUser && (
        <Avatar
          name="You"
          src={
            currentUser.discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${currentUser.discordUser.id}/${currentUser.discordUser.avatar}${currentUser.discordUser.avatar.startsWith('a_') ? '.gif' : '.png'}`
              : `https://cdn.discordapp.com/embed/avatars/${getDefaultAvatarIndex(currentUser.discordUser.id, currentUser.discordUser.discriminator)}.png`
          }
        />
      )}
      {users.slice(0, 3).map(({ connectionId }) => {
        const connection = useWebsocketStore.getState().useOther(connectionId);
        if (!connection) return null;
        return (
          <Avatar
            key={connectionId}
            name={connection.discordUser.global_name || connection.discordUser.username}
            src={
              connection.discordUser.avatar
                ? `https://cdn.discordapp.com/avatars/${connection.discordUser.id}/${connection.discordUser.avatar}${connection.discordUser.avatar.startsWith('a_') ? '.gif' : '.png'}`
                : `https://cdn.discordapp.com/embed/avatars/${getDefaultAvatarIndex(connection.discordUser.id, connection.discordUser.discriminator)}.png`
            }
          />
        );
      })}

      {hasMoreUsers && <div className={''}>+{users.length - 3}</div>}
    </div>
  );
}

export const LiveUsers = LiveUsersComponent;
