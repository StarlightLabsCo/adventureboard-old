/* eslint-disable @next/next/no-img-element */
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
        <img src={src} height={100} width={100} className={cn('h-4 w-4 rounded-full', className)} alt={name} />
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
