import { create } from 'zustand';
import { TLStore, TLStoreWithStatus, createTLStore, defaultShapeUtils, Editor, TLInstancePresence, TLComponents } from 'tldraw';

interface TldrawState {
  store: TLStore;
  storeWithStatus: TLStoreWithStatus;
  setStoreWithStatus: (status: TLStoreWithStatus) => void;
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  components: any;
  setComponents: (newComponents: any) => void;
  presenceMap: Map<string, TLInstancePresence>;
}

export const useTldrawStore = create<TldrawState>((set, get) => {
  return {
    store: createTLStore({ shapeUtils: [...defaultShapeUtils] }),
    storeWithStatus: { status: 'loading' },
    setStoreWithStatus: (status: TLStoreWithStatus) => set({ storeWithStatus: status }),
    editor: null,
    setEditor: (editor: Editor | null) => set({ editor }),
    components: {},
    setComponents: (newComponents: TLComponents) => set({ components: newComponents }),
    presenceMap: new Map<string, TLInstancePresence>(),
  };
});
