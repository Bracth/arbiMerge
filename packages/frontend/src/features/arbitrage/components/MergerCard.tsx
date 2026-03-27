import React, { useEffect, useState, useRef } from 'react';
import type { Merger } from '../types';
import { ChevronsRight } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Typography } from '../../../components/ui/Typography';
import { cn } from '../../../lib/utils';
import { TrendType, AcquisitionType } from '@arbimerge/shared';
import { useRelativeTime } from '../../../hooks/useRelativeTime';
import { ContextLabel } from './ContextLabel';

interface MergerCardProps {
  merger: Merger;
}

export const MergerCard: React.FC<MergerCardProps> = ({ merger }) => {
  const [targetPriceTrend, setTargetPriceTrend] = useState<'up' | 'down' | null>(null);
  const [buyerPriceTrend, setBuyerPriceTrend] = useState<'up' | 'down' | null>(null);
  
  const prevTargetPriceRef = useRef(merger.targetPrice);
  const prevBuyerPriceRef = useRef(merger.buyerPrice);

  const targetRelativeTime = useRelativeTime(merger.lastTargetPriceUpdate);
  const buyerRelativeTime = useRelativeTime(merger.lastBuyerPriceUpdate);

  useEffect(() => {
    if (merger.targetPrice > prevTargetPriceRef.current) {
      setTargetPriceTrend('up');
      const timer = setTimeout(() => setTargetPriceTrend(null), 1500);
      prevTargetPriceRef.current = merger.targetPrice;
      return () => clearTimeout(timer);
    } else if (merger.targetPrice < prevTargetPriceRef.current) {
      setTargetPriceTrend('down');
      const timer = setTimeout(() => setTargetPriceTrend(null), 1500);
      prevTargetPriceRef.current = merger.targetPrice;
      return () => clearTimeout(timer);
    }
    prevTargetPriceRef.current = merger.targetPrice;
  }, [merger.targetPrice]);

  useEffect(() => {
    if (merger.buyerPrice !== null && prevBuyerPriceRef.current !== null) {
      if (merger.buyerPrice > prevBuyerPriceRef.current) {
        setBuyerPriceTrend('up');
        const timer = setTimeout(() => setBuyerPriceTrend(null), 1500);
        prevBuyerPriceRef.current = merger.buyerPrice;
        return () => clearTimeout(timer);
      } else if (merger.buyerPrice < prevBuyerPriceRef.current) {
        setBuyerPriceTrend('down');
        const timer = setTimeout(() => setBuyerPriceTrend(null), 1500);
        prevBuyerPriceRef.current = merger.buyerPrice;
        return () => clearTimeout(timer);
      }
    }
    prevBuyerPriceRef.current = merger.buyerPrice;
  }, [merger.buyerPrice]);

  const spreadColor = merger.spread > 0 ? 'text-tertiary' : 'text-error';
  const showBuyerPrice = (merger.acquisitionType === AcquisitionType.STOCK || merger.acquisitionType === AcquisitionType.MIXED) && !!merger.buyerTicker;

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
              targetPriceTrend === 'up' && "flash-green",
              targetPriceTrend === 'down' && "flash-red"
            )}
          >
            ${merger.targetPrice?.toFixed(2)}
          </Typography>
          <ContextLabel className="mt-1">
            Last update {targetRelativeTime}
          </ContextLabel>
        </div>
        <div className="flex gap-2 text-outline-variant/30">
          <ChevronsRight className="w-6 h-6" />
        </div>
        <div className="flex gap-6 text-right">
          {showBuyerPrice && (
            <div className="flex flex-col">
              <Typography variant="label" className="mb-1">
                ACQUIRER PRICE
              </Typography>
              <Typography
                variant="h2"
                tabular
                className={cn(
                  "text-on-surface transition-colors duration-300",
                  buyerPriceTrend === 'up' && "flash-green",
                  buyerPriceTrend === 'down' && "flash-red"
                )}
              >
                {merger.buyerPrice !== null ? `$${merger.buyerPrice.toFixed(2)}` : 'N/A'}
              </Typography>
              <ContextLabel className="mt-1">
                Last update {buyerRelativeTime}
              </ContextLabel>
            </div>
          )}
          <div className="flex flex-col">
            <Typography variant="label" className="mb-1">
              OFFER VALUE
            </Typography>
            <Typography variant="h2" tabular className="text-primary">
              ${merger.effectiveOfferPrice?.toFixed(2)}
            </Typography>
            {merger.acquisitionType === AcquisitionType.MIXED && (
              <ContextLabel italic={true} className="mt-1 block">
                + ${merger.cashAmount?.toFixed(2) ?? '0.00'} cash + stock
              </ContextLabel>
            )}
          </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};
