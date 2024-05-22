import { Tldraw } from 'tldraw';

// TODO: implement syncing

export function SyncedCanvas() {
  return (
    <div className="fixed inset-0">
      <Tldraw inferDarkMode />
    </div>
  );
}
