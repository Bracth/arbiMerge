import test from 'node:test';
import assert from 'node:assert';
import { AcquisitionType, Merger, MergerStatus } from '@prisma/client';
import { 
  isPublicBuyerRequired, 
  getTickersForMonitoring 
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
