import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/tailwind/utils';

type Props = {
  name: string;
  src: string;
  className?: string;
};

export function Avatar({ name, src, className }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Image src={src} height={100} width={100} className={cn('h-9 w-9 rounded-full', className)} alt={name} />
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
