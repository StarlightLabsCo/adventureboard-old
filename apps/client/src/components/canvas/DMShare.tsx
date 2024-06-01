import { LiveUsers } from '@/components/users/LiveUsers';
import { Button } from '@/components/ui/button';

export function DMShare() {
  return (
    <div className="w-full flex items-centers justify-end gap-x-2 p-1 mr-1 h-10 z-[var(--layer-panels)]">
      <LiveUsers />
      <Button className="bg-blue-500 h-full pointer-events-auto">Share</Button>
    </div>
  );
}
