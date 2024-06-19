import { GameState } from 'adventureboard-ws-types';
import { create } from 'zustand';

interface TldrawState {
  gameState: GameState;
}

export const useTldrawStore = create<TldrawState>((set, get) => ({
  gameState: {
    system: null,
    currentPageId: 'page:page',
  },
}));
