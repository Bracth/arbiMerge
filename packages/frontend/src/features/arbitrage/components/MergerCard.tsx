import React, { useEffect, useState, useRef } from 'react';
import type { Merger } from '../types';
import { ChevronsRight } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Typography } from '../../../components/ui/Typography';
import { cn } from '../../../lib/utils';
import { TrendType, AcquisitionType } from '@arbimerge/shared';

interface MergerCardProps {
  merger: Merger;
}

export const MergerCard: React.FC<MergerCardProps> = ({ merger }) => {
  const [priceTrend, setPriceTrend] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(merger.currentPrice);

  useEffect(() => {
    if (merger.currentPrice > prevPriceRef.current) {
      setPriceTrend('up');
      const timer = setTimeout(() => setPriceTrend(null), 1500);
      prevPriceRef.current = merger.currentPrice;
      return () => clearTimeout(timer);
    } else if (merger.currentPrice < prevPriceRef.current) {
      setPriceTrend('down');
      const timer = setTimeout(() => setPriceTrend(null), 1500);
      prevPriceRef.current = merger.currentPrice;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = merger.currentPrice;
  }, [merger.currentPrice]);

  const spreadColor = merger.spread > 0 ? 'text-tertiary' : 'text-error';

  return (
    <div className="bg-surface-container-high p-8 flex flex-col justify-between group hover:bg-surface-bright transition-colors duration-300">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Typography variant="h2">
              {merger.targetTicker}
            </Typography>
            <Badge variant="subtle" color="secondary">
              {merger.status.toUpperCase()}
            </Badge>
            <Badge variant="subtle" color="primary" className="text-[10px] px-1.5 py-0.5">
              {merger.acquisitionType}
            </Badge>
          </div>
          <Typography variant="body" className="text-outline-variant text-sm font-medium uppercase">
            {merger.targetName}
          </Typography>
        </div>
        <div className="text-right">
          <Typography variant="label" className="block mb-1">
            ACQUIRER
          </Typography>
          <Typography variant="body" className="text-xs font-bold text-primary">
            {merger.buyerName}
          </Typography>
        </div>
      </div>

      <div className="flex items-center justify-between mb-10">
        <div className="flex flex-col">
          <Typography variant="label" className="mb-1">
            CURRENT PRICE
          </Typography>
          <Typography
            variant="h2"
            tabular
            className={cn(
              "text-on-surface transition-colors duration-300",
              priceTrend === 'up' && "flash-green",
              priceTrend === 'down' && "flash-red"
            )}
          >
            ${merger.currentPrice?.toFixed(2)}
          </Typography>
        </div>
        <div className="flex gap-2 text-outline-variant/30">
          <ChevronsRight className="w-6 h-6" />
        </div>
        <div className="flex flex-col text-right">
          <Typography variant="label" className="mb-1">
            OFFER VALUE
          </Typography>
          <Typography variant="h2" tabular className="text-primary">
            ${merger.effectiveOfferPrice?.toFixed(2)}
          </Typography>
        </div>
      </div>

      <div className="pt-6 border-t border-outline-variant/10">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <Typography variant="body" className="text-xs font-bold text-outline-variant uppercase">
              NET SPREAD
            </Typography>
            {merger.acquisitionType !== AcquisitionType.CASH && (
              <Typography variant="body" className="text-[10px] text-outline-variant italic">
                (Dynamic Deal)
              </Typography>
            )}
          </div>
          <div className="flex flex-col items-end">
            <Typography
              variant="h1"
              tabular
              className={cn(
                "font-extrabold tracking-tighter transition-colors duration-500",
                spreadColor,
                merger.trend === TrendType.UP && "flash-green-subtle",
                merger.trend === TrendType.DOWN && "flash-red-subtle"
              )}
            >
              {merger.spread.toFixed(1)}%
            </Typography>
            {merger.lastUpdate && (
              <Typography variant="label" className="text-[9px] text-outline-variant/60 mt-1">
                LAST UPDATED: {new Date(merger.lastUpdate).toLocaleTimeString()}
              </Typography>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
