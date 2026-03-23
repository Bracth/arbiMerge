export interface Merger {
  id: string;
  targetTicker: string;
  targetName: string;
  buyerName: string;
  offerPrice: number;
  currentPrice: number;
  status: string;
  announcedDate: string;
  expectedClosingDate: string;
  spread: number;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'error' | 'idle';

export interface PriceUpdate {
  ticker: string;
  price: number;
}
