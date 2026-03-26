import { Merger, AcquisitionType } from '@prisma/client';
import { TrendType } from '@arbimerge/shared';
import SpreadCalculatorService from '../services/SpreadCalculatorService.js';

/**
 * Checks if a merger is non-cash and has a public buyer ticker.
 */
export function isPublicBuyerRequired(merger: Merger): boolean {
  return merger.acquisitionType !== AcquisitionType.CASH && !!merger.buyerTicker;
}

/**
 * Extracts only the tickers we need to monitor for price updates.
 */
export function getTickersForMonitoring(mergers: Merger[]): string[] {
  return mergers.flatMap(m => {
    const symbols = [m.targetTicker];
    if (isPublicBuyerRequired(m)) {
      symbols.push(m.buyerTicker!);
    }
    return symbols;
  });
}

/**
 * Calculations and enrichment data for a merger.
 */
export interface MergerEnrichmentParams {
  targetPrice: number;
  buyerPrice?: number;
  getLastTimestamp: (symbol: string) => number | undefined;
}

/**
 * Enriches a merger with real-time price, spread, effective offer price, and trend.
 */
export function enrichMerger(merger: Merger, params: MergerEnrichmentParams) {
  const { targetPrice, buyerPrice, getLastTimestamp } = params;
  
  const spread = SpreadCalculatorService.calculateSpread(merger, targetPrice, buyerPrice);
  const effectiveOfferPrice = SpreadCalculatorService.calculateEffectiveOfferPrice(merger, buyerPrice);
  
  // Use real-time timestamps if available, otherwise fallback to DB timestamps
  const lastTargetPriceUpdate = getLastTimestamp(merger.targetTicker) || (merger.lastTargetPriceUpdate ? merger.lastTargetPriceUpdate.getTime() : null);
  const lastBuyerPriceUpdate = (merger.buyerTicker && isPublicBuyerRequired(merger)) 
    ? (getLastTimestamp(merger.buyerTicker) || (merger.lastBuyerPriceUpdate ? merger.lastBuyerPriceUpdate.getTime() : null))
    : null;

  return {
    ...merger,
    currentPrice: targetPrice,
    effectiveOfferPrice,
    spread,
    trend: TrendType.STABLE,
    lastTargetPriceUpdate,
    lastBuyerPriceUpdate
  };
}
