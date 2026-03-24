import { Merger, AcquisitionType } from '@prisma/client';
import { TrendType } from '@arbimerge/shared';
import SpreadCalculatorService from '../services/SpreadCalculatorService';

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
 * Enriches a merger with real-time price, spread, effective offer price, and trend.
 */
export function enrichMerger(merger: Merger, targetPrice: number, buyerPrice?: number, lastUpdate?: number) {
  const spread = SpreadCalculatorService.calculateSpread(merger, targetPrice, buyerPrice);
  const effectiveOfferPrice = SpreadCalculatorService.calculateEffectiveOfferPrice(merger, buyerPrice);

  return {
    ...merger,
    currentPrice: targetPrice,
    effectiveOfferPrice,
    spread,
    trend: TrendType.STABLE,
    lastUpdate
  };
}
