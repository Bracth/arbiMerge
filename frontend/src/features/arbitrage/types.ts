export interface Merger {
  id: string;
  targetTicker: string;
  targetName: string;
  buyerName: string;
  buyerTicker?: string;
  acquisitionType: 'CASH' | 'STOCK' | 'MIXED';
  offerPrice: number;
  cashAmount?: number;
  exchangeRatio?: number;
  effectiveOfferPrice: number;
  currentPrice: number;
  currency: string;
  status: string;
  announcedDate: string;
  expectedClosingDate: string;
  spread: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'error' | 'idle';

export interface PriceUpdate {
  ticker: string;
  price: number;
  timestamp: number;
  spread: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  effectiveOfferPrice: number;
}
