import { create } from 'zustand';
import { Editor } from 'tldraw';

export type TLStore = {
  editor: Editor | null;
  setEditor: (editor: Editor) => void;
};

export const useTldrawStore = create<TLStore>((set, get) => ({
  editor: null,
  setEditor: (editor: Editor) => set({ editor }),
}));
