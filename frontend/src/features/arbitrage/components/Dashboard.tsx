import React, { useEffect } from 'react';
import { useMergerStore } from '../../../lib/store';
import { useMergerWebSocket } from '../hooks/useMergerWebSocket';
import { MarketHeader } from './MarketHeader';
import { MergerGrid } from './MergerGrid';
import { TickerTape } from './TickerTape';
import type { Merger } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const dummyMergers: Merger[] = [
  {
    id: '1',
    targetTicker: 'CPRI',
    targetName: 'CAPRI HOLDINGS',
    buyerName: 'Tapestry, Inc.',
    offerPrice: 57.00,
    currentPrice: 34.12,
    status: 'Cash Deal',
    announcedDate: '2023-08-10',
    expectedClosingDate: '2024-12-31',
    spread: 67.0
  },
  {
    id: '2',
    targetTicker: 'SAVE',
    targetName: 'SPIRIT AIRLINES',
    buyerName: 'JetBlue Airways',
    offerPrice: 33.50,
    currentPrice: 16.45,
    status: 'Cash Deal',
    announcedDate: '2022-07-28',
    expectedClosingDate: '2024-06-30',
    spread: 103.6
  },
  {
    id: '3',
    targetTicker: 'X',
    targetName: 'UNITED STATES STEEL',
    buyerName: 'Nippon Steel',
    offerPrice: 55.00,
    currentPrice: 46.22,
    status: 'Cash Deal',
    announcedDate: '2023-12-18',
    expectedClosingDate: '2024-09-30',
    spread: 18.9
  },
  {
    id: '4',
    targetTicker: 'HES',
    targetName: 'HESS CORPORATION',
    buyerName: 'Chevron Corp.',
    offerPrice: 171.00,
    currentPrice: 148.90,
    status: 'Stock Deal',
    announcedDate: '2023-10-23',
    expectedClosingDate: '2024-10-31',
    spread: 14.8
  },
  {
    id: '5',
    targetTicker: 'MRO',
    targetName: 'MARATHON OIL',
    buyerName: 'ConocoPhillips',
    offerPrice: 30.25,
    currentPrice: 28.15,
    status: 'Stock Deal',
    announcedDate: '2024-05-29',
    expectedClosingDate: '2024-12-31',
    spread: 7.4
  },
  {
    id: '6',
    targetTicker: 'NM',
    targetName: 'NEUBERGER BERMAN',
    buyerName: 'Internal Merger',
    offerPrice: 10.50,
    currentPrice: 10.02,
    status: 'Cash Deal',
    announcedDate: '2024-01-15',
    expectedClosingDate: '2024-08-31',
    spread: 4.8
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
