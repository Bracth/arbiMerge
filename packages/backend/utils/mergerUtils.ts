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
  const lastUpdate = getMergerLastUpdate(merger, { getLastTimestamp });

  return {
    ...merger,
    currentPrice: targetPrice,
    effectiveOfferPrice,
    spread,
    trend: TrendType.STABLE,
    lastUpdate
  };
}

/**
 * Calculates the last update timestamp for a merger by checking both target and buyer tickers.
 */
export function getMergerLastUpdate(
  merger: Merger, 
  { getLastTimestamp }: { getLastTimestamp: (symbol: string) => number | undefined }
): number | undefined {
  const targetTimestamp = getLastTimestamp(merger.targetTicker);
  let buyerTimestamp: number | undefined;
  
  if (isPublicBuyerRequired(merger)) {
    buyerTimestamp = getLastTimestamp(merger.buyerTicker!);
  }

  if (targetTimestamp === undefined && buyerTimestamp === undefined) {
    return undefined;
  }

  // We take the latest timestamp between the two
  return Math.max(targetTimestamp || 0, buyerTimestamp || 0) || undefined;
}
