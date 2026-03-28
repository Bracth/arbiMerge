import React, { useState, useEffect } from 'react';
import { Typography } from '../../../components/ui/Typography';
import { Play, Square } from 'lucide-react';
import { cn } from '../../../lib/utils';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.bratch.cloud';

interface MarketHeaderProps {
  totalDeals: number;
}

export const MarketHeader: React.FC<MarketHeaderProps> = ({ totalDeals }) => {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check initial status
    fetch(`${BACKEND_URL}/api/demo/status`)
      .then(res => res.json())
      .then(data => setIsDemoActive(data.isDemoActive))
      .catch(console.error);
  }, []);

  const toggleDemo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/demo/toggle`, {
        method: 'POST',
      });
      const data = await res.json();
      setIsDemoActive(data.isDemoActive);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-l-4 border-primary pl-6 py-2">
      <div>
        <Typography variant="h1" className="mb-2">
          Market Mergers
        </Typography>
        <Typography variant="label" className="block mb-4">
          INSTITUTIONAL ARBITRAGE MONITORING SYSTEM
        </Typography>
        
        <button
          onClick={toggleDemo}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 flex items-center gap-2 font-bold uppercase tracking-wider border-2 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50",
            isDemoActive 
              ? "bg-error text-on-error border-error cursor-pointer" 
              : "bg-tertiary text-on-tertiary border-tertiary cursor-pointer"
          )}
        >
          {isDemoActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {isDemoActive ? "Stop Demo" : "Start Hackathon Demo"}
        </button>
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
