import { Merger, AcquisitionType } from '@prisma/client';

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
