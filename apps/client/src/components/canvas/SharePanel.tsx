import discordSdk from '@/lib/discord';
import { LiveUsers } from '@/components/users/LiveUsers';

export function SharePanel() {
  return (
    <div className="w-full flex items-centers justify-end gap-x-2 p-1 mr-1 h-10 shrink-0">
      <LiveUsers />
      <button
        onClick={() => discordSdk.commands.openInviteDialog()}
        className="bg-blue-500 h-full pointer-events-auto cursor-pointer font-semibold text-xs px-3 py-1 hover:bg-blue-600 text-white rounded-[--radius-3]"
      >
        Invite
      </button>
    </div>
  );
}
