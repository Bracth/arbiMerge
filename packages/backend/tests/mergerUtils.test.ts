import test from 'node:test';
import assert from 'node:assert';
import { AcquisitionType, Merger, MergerStatus } from '@prisma/client';
import { 
  isPublicBuyerRequired, 
  getTickersForMonitoring,
  enrichMerger
} from '../utils/mergerUtils.js';

// Mock Merger object generator
const createMockMerger = (overrides: Partial<Merger> = {}): Merger => ({
  id: '1',
  targetTicker: 'TGT',
  targetName: 'Target',
  buyerName: 'Buyer',
  buyerTicker: 'BUY',
  acquisitionType: AcquisitionType.CASH,
  offerPrice: 100,
  cashAmount: null,
  exchangeRatio: null,
  currency: 'USD',
  status: MergerStatus.PENDING,
  announcedDate: new Date(),
  expectedClosingDate: 'Q4 2026',
  lastTargetPriceUpdate: null,
  lastBuyerPriceUpdate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

test('mergerUtils - isPublicBuyerRequired', () => {
  // Case 1: CASH merger -> false
  const cashMerger = createMockMerger({
    acquisitionType: AcquisitionType.CASH,
    buyerTicker: 'BUY'
  });
  assert.strictEqual(isPublicBuyerRequired(cashMerger), false);

  // Case 2: STOCK merger with buyerTicker -> true
  const stockMerger = createMockMerger({
    acquisitionType: AcquisitionType.STOCK,
    buyerTicker: 'BUY'
  });
  assert.strictEqual(isPublicBuyerRequired(stockMerger), true);

  // Case 3: STOCK merger without buyerTicker -> false
  const stockMergerNoBuyer = createMockMerger({
    acquisitionType: AcquisitionType.STOCK,
    buyerTicker: null
  });
  assert.strictEqual(isPublicBuyerRequired(stockMergerNoBuyer), false);

  // Case 4: MIXED merger with buyerTicker -> true
  const mixedMerger = createMockMerger({
    acquisitionType: AcquisitionType.MIXED,
    buyerTicker: 'BUY'
  });
  assert.strictEqual(isPublicBuyerRequired(mixedMerger), true);
});

test('mergerUtils - getTickersForMonitoring', () => {
  const mergers = [
    createMockMerger({
      targetTicker: 'CASH_TGT',
      acquisitionType: AcquisitionType.CASH,
      buyerTicker: 'CASH_BUY'
    }),
    createMockMerger({
      targetTicker: 'STOCK_TGT',
      acquisitionType: AcquisitionType.STOCK,
      buyerTicker: 'STOCK_BUY'
    }),
    createMockMerger({
      targetTicker: 'MIXED_TGT',
      acquisitionType: AcquisitionType.MIXED,
      buyerTicker: 'MIXED_BUY'
    }),
    createMockMerger({
      targetTicker: 'STOCK_NO_BUY_TGT',
      acquisitionType: AcquisitionType.STOCK,
      buyerTicker: null
    })
  ];

  const symbols = getTickersForMonitoring(mergers);
  
  // Expected: 
  // - CASH_TGT (buyer skipped)
  // - STOCK_TGT, STOCK_BUY
  // - MIXED_TGT, MIXED_BUY
  // - STOCK_NO_BUY_TGT (buyer null)
  
  assert.deepStrictEqual(symbols, [
    'CASH_TGT',
    'STOCK_TGT', 'STOCK_BUY',
    'MIXED_TGT', 'MIXED_BUY',
    'STOCK_NO_BUY_TGT'
  ]);
});

test('mergerUtils - enrichMerger', () => {
  const merger = createMockMerger({
    targetTicker: 'TGT',
    buyerTicker: 'BUY',
    acquisitionType: AcquisitionType.STOCK,
    exchangeRatio: 0.5,
    lastTargetPriceUpdate: new Date(500),
    lastBuyerPriceUpdate: new Date(600)
  });

  const timestamps: Record<string, number> = {
    'TGT': 1000,
    'BUY': 2000,
  };

  const params = {
    targetPrice: 100,
    buyerPrice: 210,
    getLastTimestamp: (s: string) => timestamps[s]
  };

  const enriched = enrichMerger(merger, params);

  // Spread = ((offerValue - targetPrice) / targetPrice) * 100
  // offerValue = 210 * 0.5 = 105
  // spread = ((105 - 100) / 100) * 100 = 5%
  assert.strictEqual(enriched.targetPrice, 100);
  assert.strictEqual(enriched.buyerPrice, 210);
  assert.strictEqual(enriched.effectiveOfferPrice, 105);
  assert.strictEqual(enriched.spread, 5);
  assert.strictEqual(enriched.lastTargetPriceUpdate, 1000);
  assert.strictEqual(enriched.lastBuyerPriceUpdate, 2000);
  assert.strictEqual((enriched as any).lastUpdate, undefined);
});

test('mergerUtils - enrichMerger with fallback to DB timestamps', () => {
  const merger = createMockMerger({
    targetTicker: 'TGT',
    buyerTicker: 'BUY',
    acquisitionType: AcquisitionType.STOCK,
    exchangeRatio: 0.5,
    lastTargetPriceUpdate: new Date(500),
    lastBuyerPriceUpdate: new Date(600)
  });

  const params = {
    targetPrice: 100,
    buyerPrice: 210,
    getLastTimestamp: (s: string) => undefined
  };

  const enriched = enrichMerger(merger, params);

  assert.strictEqual(enriched.lastTargetPriceUpdate, 500);
  assert.strictEqual(enriched.lastBuyerPriceUpdate, 600);
});
