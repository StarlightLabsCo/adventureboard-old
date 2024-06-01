import { LiveUsers } from '@/components/users/LiveUsers';
import { Button } from '@/components/ui/button';

export function DMShare() {
  return (
    <div className="w-full flex items-centers justify-end gap-x-2 p-1 h-10">
      <LiveUsers />
      <Button className="bg-blue-500 h-full">Share</Button>
    </div>
  );
}
