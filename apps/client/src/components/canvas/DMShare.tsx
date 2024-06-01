import { LiveUsers } from '@/components/users/LiveUsers';
import { Button } from '@/components/ui/button';

export function DMShare() {
  return (
    <div className="w-full flex items-centers gap-x-2 z-10">
      <LiveUsers />
      <Button>Share</Button>
    </div>
  );
}
