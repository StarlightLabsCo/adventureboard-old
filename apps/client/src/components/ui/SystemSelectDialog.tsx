export function SystemSelectDialog() {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen bg-black/50 z-[1000] flex items-center justify-center backdrop-blur-sm">
      <div className="w-3/4 h-3/4 shrink-0 bg-white rounded-[30px] flex flex-col items-center">
        <h1 className="text-[var(--color-text-0)]">Select a system</h1>
        <div className="flex justify-evenly w-full">
          <div>D&D 5e</div>
          <div>Pathfinder</div>
          <div>Daggerheart</div>
          <div>Other</div>
        </div>
      </div>
    </div>
  );
}
