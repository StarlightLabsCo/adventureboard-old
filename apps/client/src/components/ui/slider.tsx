import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/tailwind/utils';

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <SliderPrimitive.Root ref={ref} className={cn('group relative flex w-full touch-none select-none items-center', className)} {...props}>
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--color-primary)/20]">
        <SliderPrimitive.Range className="absolute h-full bg-[var(--color-primary)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="cursor-pointer block h-4 w-4 rounded-full border border-[var(--color-primary)/50] bg-[var(--color-background)] shadow-[var(--shadow-1)] transition-colors focus-visible:outline-none focus-visible:ring-1 group-hover:ring-1  focus-visible:ring-[var(--color-focus)] disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
