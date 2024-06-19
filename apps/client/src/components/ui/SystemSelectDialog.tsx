export function SystemSelectDialog() {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen bg-black/50 z-[1000] flex items-center justify-center backdrop-blur-sm">
      <div className="w-3/4 h-3/4 shrink-0 bg-white rounded-[30px] flex flex-col items-center">
        <h1 className="text-[var(--color-text-0)]">Select a system</h1>
        <div className="flex justify-evenly gap-x-5 w-full">
          <div className="relative h-full w-full bg-gray-200 flex flex-col rounded-md">
            <img src="/covers/dnd.webp" />
            <div className="absolute bottom-0 left-1/2 text-white drop-shadow-md z-[1001]">D&D 5e</div>
          </div>
          <div className="relative h-full w-full bg-gray-200 flex flex-col rounded-md">
            <img src="/covers/pathfinder.webp" />
            <div className="absolute bottom-0 left-1/2 text-lg text-white drop-shadow-md z-[1001]">Pathfinder</div>
          </div>
          <div className="relative h-full w-full bg-gray-200 flex flex-col rounded-md">
            <img src="/covers/daggerheart.webp" />
            <div className="absolute bottom-0 left-1/2 text-lg text-white drop-shadow-md z-[1001]">Daggerheart</div>
          </div>
          <div className="relative h-full w-full bg-gray-200 flex flex-col rounded-md">
            <img src="/covers/other.webp" />
            <div className="absolute bottom-0 left-1/2 text-lg text-white drop-shadow-md z-[1001]">Other</div>
          </div>
        </div>
      </div>
    </div>
  );
}
