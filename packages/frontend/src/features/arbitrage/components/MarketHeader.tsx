import React from 'react';
import { Typography } from '../../../components/ui/Typography';

interface MarketHeaderProps {
  totalDeals: number;
}

export const MarketHeader: React.FC<MarketHeaderProps> = ({ totalDeals }) => {
  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-l-4 border-primary pl-6 py-2">
      <div>
        <Typography variant="h1" className="mb-2">
          Market Mergers
        </Typography>
        <Typography variant="label">
          INSTITUTIONAL ARBITRAGE MONITORING SYSTEM
        </Typography>
      </div>
      <div className="mt-6 md:mt-0 text-right">
        <div className="bg-surface-container-high px-4 py-2 inline-block">
          <Typography variant="label" className="block mb-1 text-outline">
            DEALS TRACKED
          </Typography>
          <Typography variant="h2" tabular className="text-3xl text-primary">
            {totalDeals}
          </Typography>
        </div>
      </div>
    </section>
  );
};
