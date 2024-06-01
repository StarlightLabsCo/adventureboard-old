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
        <img src={src} className={cn('h-[30px] w-[30px] aspect-square z-10 rounded-full', className)} alt={name} />
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
