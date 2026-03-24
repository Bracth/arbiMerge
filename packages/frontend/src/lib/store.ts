import { create } from 'zustand';
import type { Merger, ConnectionStatus } from '../features/arbitrage';
import { TrendType } from '@arbimerge/shared';

interface MergerState {
  mergers: Merger[];
  prices: Record<string, number>;
  priceTimestamps: Record<string, number>;
  connectionStatus: ConnectionStatus;
  lastUpdate: string | null;
  error: string | null;
  setMergers: (mergers: Merger[]) => void;
  updateMergerPrice: (ticker: string, currentPrice: number, spread: number, trend: TrendType, effectiveOfferPrice: number, timestamp?: number) => void;
  updateMultiplePrices: (prices: { symbol: string, price: number, spread: number, trend: TrendType, effectiveOfferPrice: number, timestamp?: number }[]) => void;
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

  setMergers: (mergers) => set(() => {
    console.log('[Store] Setting mergers:', mergers.length);
    return {
      mergers,
      lastUpdate: new Date().toISOString()
    };
  }),

  updateMergerPrice: (ticker, currentPrice, spread, trend, effectiveOfferPrice, timestamp) => set((state) => {
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
            effectiveOfferPrice,
            spread,
            trend,
            lastUpdate: updateTimestamp
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
    const newSpreads: Record<string, number> = {};
    const newTrends: Record<string, TrendType> = {};
    const newEffectiveOfferPrices: Record<string, number> = {};
    const symbolsActuallyUpdated = new Set<string>();
    let anyUpdated = false;

    // Actualizar cach├® de precios y timestamps
    priceUpdates.forEach(update => {
      const currentTimestamp = newTimestamps[update.symbol] || 0;
      const updateTimestamp = update.timestamp || Date.now();

      if (updateTimestamp >= currentTimestamp) {
        newPrices[update.symbol] = update.price;
        newTimestamps[update.symbol] = updateTimestamp;
        newSpreads[update.symbol] = update.spread;
        newTrends[update.symbol] = update.trend;
        newEffectiveOfferPrices[update.symbol] = update.effectiveOfferPrice;
        symbolsActuallyUpdated.add(update.symbol);
        anyUpdated = true;
      }
    });

    if (!anyUpdated) {
      console.log('[Store] No prices were newer than current cache');
      return state;
    }

    // Actualizar la lista de mergers si ya est├í cargada
    const updatedMergers = state.mergers.map((m) => {
      const targetUpdated = symbolsActuallyUpdated.has(m.targetTicker);
      const buyerUpdated = m.buyerTicker && symbolsActuallyUpdated.has(m.buyerTicker);

      if (targetUpdated || buyerUpdated) {
        const targetTimestamp = newTimestamps[m.targetTicker] || 0;
        const buyerTimestamp = m.buyerTicker ? (newTimestamps[m.buyerTicker] || 0) : 0;
        
        // Usar el timestamp m├ís reciente para el lastUpdate de la fusi├│n
        const lastUpdate = Math.max(targetTimestamp, buyerTimestamp, m.lastUpdate || 0);

        // Preferir valores del targetTicker si se actualiz├│, de lo contrario usar el del buyerTicker
        const sourceTicker = targetUpdated ? m.targetTicker : (m.buyerTicker as string);

        return {
          ...m,
          currentPrice: newPrices[m.targetTicker] ?? m.currentPrice,
          effectiveOfferPrice: newEffectiveOfferPrices[sourceTicker] ?? m.effectiveOfferPrice,
          spread: newSpreads[sourceTicker] ?? m.spread,
          trend: newTrends[sourceTicker] ?? m.trend,
          lastUpdate
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
