import React, { useEffect } from 'react';
import { useMergerStore } from '../../../lib/store';
import { useMergerWebSocket } from '../hooks/useMergerWebSocket';
import { MarketHeader } from './MarketHeader';
import { MergerGrid } from './MergerGrid';
import { TickerTape } from './TickerTape';
import type { Merger } from '../types';
import { AcquisitionType, MergerStatus, TrendType } from '@arbimerge/shared';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const dummyMergers: Merger[] = [
  {
    id: '1',
    targetTicker: 'CPRI',
    targetName: 'CAPRI HOLDINGS',
    buyerName: 'Tapestry, Inc.',
    acquisitionType: AcquisitionType.CASH,
    offerPrice: 57.00,
    effectiveOfferPrice: 57.00,
    currentPrice: 34.12,
    currency: 'USD',
    status: MergerStatus.ANNOUNCED,
    announcedDate: '2023-08-10',
    expectedClosingDate: '2024-12-31',
    spread: 67.0,
    trend: TrendType.STABLE
  },
  {
    id: '2',
    targetTicker: 'SAVE',
    targetName: 'SPIRIT AIRLINES',
    buyerName: 'JetBlue Airways',
    acquisitionType: AcquisitionType.CASH,
    offerPrice: 33.50,
    effectiveOfferPrice: 33.50,
    currentPrice: 16.45,
    currency: 'USD',
    status: MergerStatus.ANNOUNCED,
    announcedDate: '2022-07-28',
    expectedClosingDate: '2024-06-30',
    spread: 103.6,
    trend: TrendType.STABLE
  },
  {
    id: '3',
    targetTicker: 'X',
    targetName: 'UNITED STATES STEEL',
    buyerName: 'Nippon Steel',
    acquisitionType: AcquisitionType.CASH,
    offerPrice: 55.00,
    effectiveOfferPrice: 55.00,
    currentPrice: 46.22,
    currency: 'USD',
    status: MergerStatus.ANNOUNCED,
    announcedDate: '2023-12-18',
    expectedClosingDate: '2024-09-30',
    spread: 18.9,
    trend: TrendType.STABLE
  },
  {
    id: '4',
    targetTicker: 'HES',
    targetName: 'HESS CORPORATION',
    buyerName: 'Chevron Corp.',
    acquisitionType: AcquisitionType.STOCK,
    offerPrice: 171.00,
    effectiveOfferPrice: 171.00,
    currentPrice: 148.90,
    currency: 'USD',
    status: MergerStatus.ANNOUNCED,
    announcedDate: '2023-10-23',
    expectedClosingDate: '2024-10-31',
    spread: 14.8,
    trend: TrendType.STABLE
  },
  {
    id: '5',
    targetTicker: 'MRO',
    targetName: 'MARATHON OIL',
    buyerName: 'ConocoPhillips',
    acquisitionType: AcquisitionType.STOCK,
    offerPrice: 30.25,
    effectiveOfferPrice: 30.25,
    currentPrice: 28.15,
    currency: 'USD',
    status: MergerStatus.ANNOUNCED,
    announcedDate: '2024-05-29',
    expectedClosingDate: '2024-12-31',
    spread: 7.4,
    trend: TrendType.STABLE
  },
  {
    id: '6',
    targetTicker: 'NM',
    targetName: 'NEUBERGER BERMAN',
    buyerName: 'Internal Merger',
    acquisitionType: AcquisitionType.CASH,
    offerPrice: 10.50,
    effectiveOfferPrice: 10.50,
    currentPrice: 10.02,
    currency: 'USD',
    status: MergerStatus.ANNOUNCED,
    announcedDate: '2024-01-15',
    expectedClosingDate: '2024-08-31',
    spread: 4.8,
    trend: TrendType.STABLE
  }
];

export const Dashboard: React.FC = () => {
  const { mergers, setMergers, setError } = useMergerStore();
  useMergerWebSocket();

  useEffect(() => {
    const fetchMergers = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/mergers`);
        if (!response.ok) {
          throw new Error('Failed to fetch mergers');
        }
        const data = await response.json();
        if (data && data.length > 0) {
          setMergers(data);
        } else {
          setMergers(dummyMergers);
        }
      } catch (err) {
        console.error('Error fetching mergers:', err);
        setError('Failed to fetch initial data. Using fallback data.');
        setMergers(dummyMergers);
      }
    };

    fetchMergers();
  }, [setMergers, setError]);

  return (
    <main className="px-8 pb-20">
      <MarketHeader totalDeals={mergers.length} />

      {/* Merger Cards Grid */}
      <MergerGrid mergers={mergers} />

      {/* System Ticker Tape */}
      <TickerTape />
    </main>
  );
};
