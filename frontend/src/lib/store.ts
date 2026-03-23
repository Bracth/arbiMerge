import { create } from 'zustand';
import type { Merger, ConnectionStatus } from '../features/arbitrage';

interface MergerState {
  mergers: Merger[];
  prices: Record<string, number>;
  priceTimestamps: Record<string, number>;
  connectionStatus: ConnectionStatus;
  lastUpdate: string | null;
  error: string | null;
  setMergers: (mergers: Merger[]) => void;
  updateMergerPrice: (ticker: string, currentPrice: number, timestamp?: number) => void;
  updateMultiplePrices: (prices: { symbol: string, price: number, timestamp?: number }[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
}

export const useMergerStore = create<MergerState>((set) => ({
  mergers: [],
  prices: {},
  priceTimestamps: {},
  connectionStatus: 'idle',
  lastUpdate: null,
  error: null,

  setMergers: (mergers) => set((state) => {
    console.log('[Store] Setting mergers:', mergers.length);
    return {
      mergers: mergers.map(m => {
        // Si ya tenemos un precio m├ís reciente en el store (del WebSocket), lo usamos
        const cachedPrice = state.prices[m.targetTicker];
        const finalPrice = cachedPrice !== undefined ? cachedPrice : m.currentPrice;
        
        if (cachedPrice !== undefined) {
          console.log(`[Store] Using cached price for ${m.targetTicker}: ${cachedPrice}`);
        }

        return {
          ...m,
          currentPrice: finalPrice,
          spread: finalPrice > 0 ? ((m.offerPrice - finalPrice) / finalPrice) * 100 : 0
        };
      }),
      lastUpdate: new Date().toISOString()
    };
  }),

  updateMergerPrice: (ticker, currentPrice, timestamp) => set((state) => {
    const currentTimestamp = state.priceTimestamps[ticker] || 0;
    const updateTimestamp = timestamp || Date.now();

    if (updateTimestamp < currentTimestamp) {
      console.log(`[Store] Skipping update for ${ticker}: stale timestamp`);
      return state;
    }

    console.log(`[Store] Updating price for ${ticker}: ${currentPrice}`);

    return {
      prices: {
        ...state.prices,
        [ticker]: currentPrice
      },
      mergers: state.mergers.map((m) =>
        m.targetTicker === ticker
          ? {
            ...m,
            currentPrice,
            spread: currentPrice > 0 ? ((m.offerPrice - currentPrice) / currentPrice) * 100 : 0
          }
          : m
      ),
      priceTimestamps: {
        ...state.priceTimestamps,
        [ticker]: updateTimestamp
      },
      lastUpdate: new Date().toISOString()
    };
  }),

  updateMultiplePrices: (priceUpdates) => set((state) => {
    console.log(`[Store] Received ${priceUpdates.length} initial prices`);
    const newPrices = { ...state.prices };
    const newTimestamps = { ...state.priceTimestamps };
    let anyUpdated = false;

    // Actualizar cach├® de precios y timestamps
    priceUpdates.forEach(update => {
      const currentTimestamp = newTimestamps[update.symbol] || 0;
      const updateTimestamp = update.timestamp || Date.now();

      if (updateTimestamp >= currentTimestamp) {
        newPrices[update.symbol] = update.price;
        newTimestamps[update.symbol] = updateTimestamp;
        anyUpdated = true;
      }
    });

    if (!anyUpdated) {
      console.log('[Store] No prices were newer than current cache');
      return state;
    }

    // Actualizar la lista de mergers si ya est├í cargada
    const updatedMergers = state.mergers.map((m) => {
      const currentPrice = newPrices[m.targetTicker];
      if (currentPrice !== undefined) {
        return {
          ...m,
          currentPrice,
          spread: currentPrice > 0 ? ((m.offerPrice - currentPrice) / currentPrice) * 100 : 0
        };
      }
      return m;
    });

    console.log(`[Store] Updated ${state.mergers.length} mergers with new prices`);

    return {
      mergers: updatedMergers,
      prices: newPrices,
      priceTimestamps: newTimestamps,
      lastUpdate: new Date().toISOString()
    };
  }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setError: (error) => set({ error }),
}));
