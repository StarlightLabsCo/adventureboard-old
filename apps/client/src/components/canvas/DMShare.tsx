import { LiveUsers } from '@/components/users/LiveUsers';
import { Button } from '@/components/ui/button';

export function DMShare() {
  return (
    <div className="w-full flex items-centers justify-end gap-x-2 m-1 z-20">
      <LiveUsers />
      <Button className="bg-blue-500">Share</Button>
    </div>
  );
}
