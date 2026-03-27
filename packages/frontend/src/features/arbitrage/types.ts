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
  targetPrice: number;
  buyerPrice: number | null;
  currency: string;
  status: MergerStatus;
  announcedDate: string;
  expectedClosingDate: string;
  spread: number;
  trend: TrendType;
  lastTargetPriceUpdate: number | null;
  lastBuyerPriceUpdate: number | null;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'error' | 'idle';

export interface PriceUpdate {
  ticker: string;
  targetPrice: number;
  buyerPrice: number | null;
  timestamp: number;
  spread: number;
  trend: TrendType;
  effectiveOfferPrice: number;
  lastTargetPriceUpdate: number | null;
  lastBuyerPriceUpdate: number | null;
}
