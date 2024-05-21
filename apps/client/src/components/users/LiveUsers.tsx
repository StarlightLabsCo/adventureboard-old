import React from 'react';
import { useOthers, useSelf } from '@liveblocks-config';
import { Avatar } from './Avatar';

const adjectives = [
  'Happy',
  'Creative',
  'Energetic',
  'Lively',
  'Dynamic',
  'Radiant',
  'Joyful',
  'Vibrant',
  'Cheerful',
  'Sunny',
  'Sparkling',
  'Bright',
  'Shining',
];

const animals = [
  'Dolphin',
  'Tiger',
  'Elephant',
  'Penguin',
  'Kangaroo',
  'Panther',
  'Lion',
  'Cheetah',
  'Giraffe',
  'Hippopotamus',
  'Monkey',
  'Panda',
  'Crocodile',
];

function hashNumberToNumber(num: number): number {
  let hash = 0;
  const str = num.toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function generateRandomName(connectionId: number): string {
  const hash = Math.abs(hashNumberToNumber(connectionId));
  const randomAdjective = adjectives[hash % adjectives.length];
  const randomAnimal = animals[hash % animals.length];

  return `${randomAdjective} ${randomAnimal}`;
}

function generateAvatarSrc(connectionId: number): string {
  const hash = Math.abs(hashNumberToNumber(connectionId));
  return `https://liveblocks.io/avatars/avatar-${hash % 30}.png`;
}

function LiveUsersComponent() {
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > 3;

  return (
    <div className="absolute top-1 right-1 flex gap-x-1 z-10 items-center ">
      {currentUser && <Avatar name="You" src={generateAvatarSrc(currentUser.connectionId)} />}
      {users.slice(0, 3).map(({ connectionId, info }) => {
        return <Avatar key={connectionId} name={generateRandomName(connectionId)} src={generateAvatarSrc(connectionId)} />;
      })}

      {hasMoreUsers && <div className={''}>+{users.length - 3}</div>}
    </div>
  );
}

export const LiveUsers = LiveUsersComponent;
