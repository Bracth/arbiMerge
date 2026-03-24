import test from 'node:test';
import assert from 'node:assert';
import { SpreadCalculatorService } from '../services/SpreadCalculatorService.js';
import { AcquisitionType, Merger, MergerStatus } from '@prisma/client';

// Mock Merger object
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

const calculator = new SpreadCalculatorService();

test('SpreadCalculatorService - CASH', () => {
  const merger = createMockMerger({
    acquisitionType: AcquisitionType.CASH,
    offerPrice: 100,
  });
  // ((100 - 90) / 90) * 100 = 11.111...
  const spread = calculator.calculateSpread(merger, 90);
  assert.strictEqual(spread, 11.11);
});

test('SpreadCalculatorService - STOCK', () => {
  const merger = createMockMerger({
    acquisitionType: AcquisitionType.STOCK,
    exchangeRatio: 0.5,
  });
  // ((200 * 0.5 - 90) / 90) * 100 = 11.111...
  const spread = calculator.calculateSpread(merger, 90, 200);
  assert.strictEqual(spread, 11.11);
});

test('SpreadCalculatorService - MIXED', () => {
  const merger = createMockMerger({
    acquisitionType: AcquisitionType.MIXED,
    exchangeRatio: 0.5,
    cashAmount: 10,
  });
  // ((180 * 0.5 + 10 - 90) / 90) * 100 = 11.111...
  const spread = calculator.calculateSpread(merger, 90, 180);
  assert.strictEqual(spread, 11.11);
});

test('SpreadCalculatorService - Edge Cases', () => {
  const merger = createMockMerger();
  
  // currentPrice = 0
  assert.strictEqual(calculator.calculateSpread(merger, 0), 0);
  
  // currentPrice < 0
  assert.strictEqual(calculator.calculateSpread(merger, -10), 0);
  
  // exchangeRatio = 0
  const stockMerger = createMockMerger({
    acquisitionType: AcquisitionType.STOCK,
    exchangeRatio: 0,
  });
  assert.strictEqual(calculator.calculateSpread(stockMerger, 90, 200), 0);
  
  // buyerPrice = 0
  assert.strictEqual(calculator.calculateSpread(stockMerger, 90, 0), 0);
});

test('SpreadCalculatorService - getTrend', () => {
  assert.strictEqual(calculator.getTrend(10, 5), 'UP');
  assert.strictEqual(calculator.getTrend(5, 10), 'DOWN');
  assert.strictEqual(calculator.getTrend(5, 5), 'STABLE');
});
