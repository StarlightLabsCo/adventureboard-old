/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/tailwind/utils';

type Props = {
  name: string;
  src: string;
  className?: string;
};

export function Avatar({ name, src, className }: Props) {
  return <img src={src} className={cn('h-[25px] w-[25px] aspect-square z-10 rounded-full pointer-events-auto', className)} alt={name} />;
}
