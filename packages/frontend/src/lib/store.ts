import { create } from 'zustand';
import type { Merger, ConnectionStatus } from '../features/arbitrage';
import { TrendType } from '@arbimerge/shared';

interface MergerState {
  mergers: Merger[];
  prices: Record<string, number | null>;
  priceTimestamps: Record<string, number>;
  connectionStatus: ConnectionStatus;
  error: string | null;
  setMergers: (mergers: Merger[]) => void;
  updateMergerPrice: (
    ticker: string, 
    targetPrice: number, 
    buyerPrice: number | null, 
    spread: number, 
    trend: TrendType, 
    effectiveOfferPrice: number, 
    lastTargetPriceUpdate: number | null, 
    lastBuyerPriceUpdate: number | null
  ) => void;
  updateMultiplePrices: (prices: { 
    symbol: string, 
    targetPrice: number, 
    buyerPrice: number | null, 
    spread: number, 
    trend: TrendType, 
    effectiveOfferPrice: number, 
    lastTargetPriceUpdate: number | null, 
    lastBuyerPriceUpdate: number | null 
  }[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
}

export const useMergerStore = create<MergerState>((set) => ({
  mergers: [],
  prices: {},
  priceTimestamps: {},
  connectionStatus: 'idle',
  error: null,

  setMergers: (mergers) => set(() => {
    console.log('[Store] Setting mergers:', mergers.length);
    return {
      mergers
    };
  }),

  updateMergerPrice: (ticker, targetPrice, buyerPrice, spread, trend, effectiveOfferPrice, lastTargetPriceUpdate, lastBuyerPriceUpdate) => set((state) => {
    const merger = state.mergers.find(m => m.targetTicker === ticker);
    
    // Reject stale updates using individual timestamps
    if (merger) {
      const isStale = (lastTargetPriceUpdate !== null && merger.lastTargetPriceUpdate !== null && lastTargetPriceUpdate < merger.lastTargetPriceUpdate) ||
                      (lastBuyerPriceUpdate !== null && merger.lastBuyerPriceUpdate !== null && lastBuyerPriceUpdate < merger.lastBuyerPriceUpdate);

      if (isStale) {
        console.log(`[Store] Skipping update for ${ticker}: stale timestamp`);
        return state;
      }
    }

    console.log(`[Store] Updating price for ${ticker}: target=${targetPrice}, buyer=${buyerPrice}`);

    const newPrices = {
      ...state.prices,
      [ticker]: targetPrice
    };

    if (merger?.buyerTicker && buyerPrice !== null) {
      newPrices[merger.buyerTicker] = buyerPrice;
    }

    return {
      prices: newPrices,
      mergers: state.mergers.map((m) =>
        m.targetTicker === ticker
          ? {
            ...m,
            targetPrice,
            buyerPrice,
            effectiveOfferPrice,
            spread,
            trend,
            lastTargetPriceUpdate,
            lastBuyerPriceUpdate
          }
          : m
      ),
      priceTimestamps: {
        ...state.priceTimestamps,
        [ticker]: lastTargetPriceUpdate || Date.now()
      }
    };
  }),

  updateMultiplePrices: (priceUpdates) => set((state) => {
    console.log(`[Store] Received ${priceUpdates.length} initial prices`);
    const newPrices = { ...state.prices };
    const newTimestamps = { ...state.priceTimestamps };
    const newSpreads: Record<string, number> = {};
    const newTrends: Record<string, TrendType> = {};
    const newEffectiveOfferPrices: Record<string, number> = {};
    const newTargetTimestamps: Record<string, number | null> = {};
    const newBuyerTimestamps: Record<string, number | null> = {};
    const newBuyerPrices: Record<string, number | null> = {};
    const symbolsActuallyUpdated = new Set<string>();
    let anyUpdated = false;

    // Actualizar caché de precios y timestamps
    priceUpdates.forEach(update => {
      const currentTimestamp = newTimestamps[update.symbol] || 0;
      const updateTimestamp = update.lastTargetPriceUpdate || Date.now();

      if (updateTimestamp >= currentTimestamp) {
        newPrices[update.symbol] = update.targetPrice;
        newTimestamps[update.symbol] = updateTimestamp;
        newSpreads[update.symbol] = update.spread;
        newTrends[update.symbol] = update.trend;
        newEffectiveOfferPrices[update.symbol] = update.effectiveOfferPrice;
        newTargetTimestamps[update.symbol] = update.lastTargetPriceUpdate;
        newBuyerTimestamps[update.symbol] = update.lastBuyerPriceUpdate;
        newBuyerPrices[update.symbol] = update.buyerPrice;
        symbolsActuallyUpdated.add(update.symbol);
        anyUpdated = true;
      }
    });

    if (!anyUpdated) {
      console.log('[Store] No prices were newer than current cache');
      return state;
    }

    // Actualizar la lista de mergers si ya está cargada
    const updatedMergers = state.mergers.map((m) => {
      const targetUpdated = symbolsActuallyUpdated.has(m.targetTicker);
      const buyerUpdated = m.buyerTicker && symbolsActuallyUpdated.has(m.buyerTicker);

      if (targetUpdated || buyerUpdated) {
        // Preferir valores del targetTicker si se actualizó, de lo contrario usar el del buyerTicker
        const sourceTicker = targetUpdated ? m.targetTicker : (m.buyerTicker as string);
        
        const lastTargetPriceUpdate = newTargetTimestamps[sourceTicker] ?? m.lastTargetPriceUpdate;
        const lastBuyerPriceUpdate = newBuyerTimestamps[sourceTicker] ?? m.lastBuyerPriceUpdate;

        // Reject stale updates using individual timestamps
        const isStale = (lastTargetPriceUpdate !== null && m.lastTargetPriceUpdate !== null && lastTargetPriceUpdate < m.lastTargetPriceUpdate) ||
                        (lastBuyerPriceUpdate !== null && m.lastBuyerPriceUpdate !== null && lastBuyerPriceUpdate < m.lastBuyerPriceUpdate);

        if (isStale) {
          return m;
        }

        // If we have a buyer ticker, also update its price in the cache if it came in this update
        if (m.buyerTicker && newBuyerPrices[sourceTicker] !== undefined) {
          newPrices[m.buyerTicker] = newBuyerPrices[sourceTicker];
        }

        return {
          ...m,
          targetPrice: newPrices[m.targetTicker] ?? m.targetPrice,
          buyerPrice: newBuyerPrices[sourceTicker] ?? m.buyerPrice,
          effectiveOfferPrice: newEffectiveOfferPrices[sourceTicker] ?? m.effectiveOfferPrice,
          spread: newSpreads[sourceTicker] ?? m.spread,
          trend: newTrends[sourceTicker] ?? m.trend,
          lastTargetPriceUpdate,
          lastBuyerPriceUpdate
        };
      }
      return m;
    });

    console.log(`[Store] Updated ${state.mergers.length} mergers with new prices`);

    return {
      mergers: updatedMergers,
      prices: newPrices,
      priceTimestamps: newTimestamps
    };
  }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setError: (error) => set({ error }),
}));
