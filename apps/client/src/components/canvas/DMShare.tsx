import { LiveUsers } from '@/components/users/LiveUsers';

export function DMShare() {
  return (
    <div className="w-full flex items-centers gap-x-2 text-center">
      <LiveUsers />
      <button className="bg-primary text-foreground rounded-sm">Share</button>
    </div>
  );
}
