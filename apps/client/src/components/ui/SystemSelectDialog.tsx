export function SystemSelectDialog() {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black/50">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--color-panel)] rounded-[var(--radius-2)] flex flex-col items-center">
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
