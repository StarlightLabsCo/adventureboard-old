type OutpaintInDirectionButtonProps = {
  x: number;
  y: number;
  rotation: number;
};

export function OutpaintInDirectionButton({ x, y, rotation }: OutpaintInDirectionButtonProps) {
  const outpaintImage = () => {
    console.log('outpainting');
  };

  return (
    <div
      className="absolute cursor-pointer hover:scale-110 hover:bg-gray-200 transition-transform"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `rotate(${rotation}rad)`,
      }}
      onClick={outpaintImage}
    >
      →
    </div>
  );
}
