import { LiveUsers } from '@/components/users/LiveUsers';
import { Button } from '@/components/ui/button';

export function DMShare() {
  return (
    <div className="w-full flex items-centers justify-end gap-x-2">
      <LiveUsers />
      <Button>Share</Button>
    </div>
  );
}
