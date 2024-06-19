export function SystemSelectDialog() {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen bg-black/50 z-[1000] flex items-center justify-center">
      <div className="w-[500px] h-[500px] shrink-0 bg-[var(--color-panel)] rounded-[var(--radius-2)] flex flex-col items-center">
        <h1 className="text-[var(--color-text-0)]">Select a system</h1>
        <div className="flex justify-between">
          <div>D&D 5e</div>
          <div>Pathfinder</div>
          <div>Other</div>
        </div>
      </div>
    </div>
  );
}
