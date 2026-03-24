import { TrendType, MergerStatus, AcquisitionType } from '@arbimerge/shared';

export interface Merger {
  id: string;
  targetTicker: string;
  targetName: string;
  buyerName: string;
  buyerTicker?: string;
  acquisitionType: AcquisitionType;
  offerPrice: number;
  cashAmount?: number;
  exchangeRatio?: number;
  effectiveOfferPrice: number;
  currentPrice: number;
  currency: string;
  status: MergerStatus;
  announcedDate: string;
  expectedClosingDate: string;
  spread: number;
  trend: TrendType;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'error' | 'idle';

export interface PriceUpdate {
  ticker: string;
  price: number;
  timestamp: number;
  spread: number;
  trend: TrendType;
  effectiveOfferPrice: number;
}
