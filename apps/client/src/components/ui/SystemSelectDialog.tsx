export function SystemSelectDialog() {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen bg-black/50 z-[1000] flex items-center justify-center backdrop-blur-sm">
      <div className="w-3/4 h-3/4 shrink-0 bg-white rounded-[30px] flex flex-col items-center">
        <h1 className="text-[var(--color-text-0)]">Select a system</h1>
        <div className="flex justify-evenly items-center gap-x-5 w-full h-full px-2">
          <div className="relative h-full w-full bg-gray-200 flex flex-col rounded-md">
            <img src="/covers/dnd.webp" className="rounded-md" />
          </div>
          <div className="relative h-full w-full bg-gray-200 flex flex-col rounded-md">
            <img src="/covers/pathfinder.webp" className="rounded-md" />
          </div>
          <div className="relative h-full w-full bg-gray-200 flex flex-col rounded-md">
            <img src="/covers/daggerheart.webp" className="rounded-md" />
          </div>
          <div className="relative h-full w-full bg-gray-200 flex flex-col rounded-md">
            <img src="/covers/other.webp" className="rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
