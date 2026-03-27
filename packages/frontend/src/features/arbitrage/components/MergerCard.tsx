import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Merger } from '../types';
import { ChevronsRight, Sparkles } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Typography } from '../../../components/ui/Typography';
import { Modal } from '../../../components/ui/Modal';
import { cn } from '../../../lib/utils';
import { TrendType, AcquisitionType } from '@arbimerge/shared';
import { useRelativeTime } from '../../../hooks/useRelativeTime';
import { useAISummaryStream } from '../hooks/useAISummaryStream';
import { ContextLabel } from './ContextLabel';

interface MergerCardProps {
  merger: Merger;
}

export const MergerCard: React.FC<MergerCardProps> = ({ merger }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetPriceTrend, setTargetPriceTrend] = useState<'up' | 'down' | null>(null);
  const [buyerPriceTrend, setBuyerPriceTrend] = useState<'up' | 'down' | null>(null);
  const prevTargetPriceRef = useRef(merger.targetPrice);
  const prevBuyerPriceRef = useRef(merger.buyerPrice);

  const targetRelativeTime = useRelativeTime(merger.lastTargetPriceUpdate);
  const buyerRelativeTime = useRelativeTime(merger.lastBuyerPriceUpdate);
  const { summary, isStreaming, error, startStream, closeStream } = useAISummaryStream();

  const handleModalOpenChange = useCallback((open: boolean) => {
    setIsModalOpen(open);
    if (open) {
      startStream(merger.id);
    } else {
      closeStream();
    }
  }, [merger.id, startStream, closeStream]);

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

      <div className="mt-6 pt-6 border-t border-outline-variant/10">
        <Modal open={isModalOpen} onOpenChange={handleModalOpenChange}>
          <Modal.Trigger>
            <button
              className="w-full py-3 flex items-center justify-center gap-2 bg-primary text-on-primary font-bold uppercase tracking-wider border-2 border-primary hover:bg-transparent hover:text-primary transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isStreaming}
            >
              <Sparkles className="w-4 h-4" />
              Analyze Deal
            </button>
          </Modal.Trigger>

          <Modal.Content className="max-w-2xl">
            <Modal.Header>
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>AI Analysis: {merger.targetTicker} / {merger.buyerName}</span>
                {isStreaming && (
                  <Badge variant="solid" color="primary" className="animate-pulse">
                    Analyzing...
                  </Badge>
                )}
              </div>
            </Modal.Header>

            <Modal.Body>
              {error && (
                <div className="p-4 mb-4 bg-error-container text-on-error-container border border-error/20 rounded">
                  <Typography variant="body" className="font-bold">Error</Typography>
                  <Typography variant="body" className="text-sm">{error}</Typography>
                </div>
              )}
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[200px] text-on-surface">
                {summary}
                {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />}
                {!isStreaming && !summary && !error && (
                  <div className="flex items-center justify-center h-[200px] text-outline-variant">
                    Initializing analysis...
                  </div>
                )}
              </div>
            </Modal.Body>

            <Modal.Footer>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-outline text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Close
              </button>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      </div>
    </div>
  );
};
