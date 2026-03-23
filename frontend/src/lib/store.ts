import { create } from 'zustand';
import type { Merger, ConnectionStatus } from '../features/arbitrage';

interface MergerState {
  mergers: Merger[];
  connectionStatus: ConnectionStatus;
  lastUpdate: string | null;
  error: string | null;
  setMergers: (mergers: Merger[]) => void;
  updateMergerPrice: (ticker: string, currentPrice: number) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
}

export const useMergerStore = create<MergerState>((set) => ({
  mergers: [],
  connectionStatus: 'idle',
  lastUpdate: null,
  error: null,

  setMergers: (mergers) => set({
    mergers: mergers.map(m => ({
      ...m,
      spread: m.currentPrice > 0 ? ((m.offerPrice - m.currentPrice) / m.currentPrice) * 100 : 0
    })),
    lastUpdate: new Date().toISOString()
  }),

  updateMergerPrice: (ticker, currentPrice) => set((state) => ({
    mergers: state.mergers.map((m) =>
      m.targetTicker === ticker
        ? {
          ...m,
          currentPrice,
          spread: currentPrice > 0 ? ((m.offerPrice - currentPrice) / currentPrice) * 100 : 0
        }
        : m
    ),
    lastUpdate: new Date().toISOString()
  })),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setError: (error) => set({ error }),
}));
