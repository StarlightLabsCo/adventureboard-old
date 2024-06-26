import { cn } from '@/lib/tailwind/utils';

type OutpaintInDirectionButtonProps = {
  x: number;
  y: number;
  rotation: number;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
};

export function OutpaintInDirectionButton({
  x,
  y,
  rotation,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
}: OutpaintInDirectionButtonProps) {
  return (
    <div
      className={cn(
        'absolute cursor-pointer text-[var(--color-text-1)] hover:scale-110 hover:text-[var(--color-text-0)] transition-colors',
        className,
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `rotate(${rotation}rad)`,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-[var(--layer-canvas)]">
        <path
          d="M7.14645 2.14645C7.34171 1.95118 7.65829 1.95118 7.85355 2.14645L11.8536 6.14645C12.0488 6.34171 12.0488 6.65829 11.8536 6.85355C11.6583 7.04882 11.3417 7.04882 11.1464 6.85355L8 3.70711L8 12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5L7 3.70711L3.85355 6.85355C3.65829 7.04882 3.34171 7.04882 3.14645 6.85355C2.95118 6.65829 2.95118 6.34171 3.14645 6.14645L7.14645 2.14645Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
