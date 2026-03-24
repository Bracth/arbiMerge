import React from 'react';

export const TickerTape: React.FC = () => {
  return (
    <div className="mt-12 bg-surface-container-low py-3 overflow-hidden whitespace-nowrap">
      <div className="flex gap-12 animate-scroll">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-outline">NY-ARBITRAGE-DESK:</span>
          <span className="text-xs text-primary font-mono tabular-nums">LATENCY: 0.12ms</span>
          <span className="text-xs text-tertiary font-mono tabular-nums">CONNECTED: WS_204</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-outline">LATEST_SIGNAL:</span>
          <span className="text-xs text-on-surface font-mono tabular-nums">SAVE Vol: +12%</span>
          <span className="text-xs text-error font-mono tabular-nums">CPRI Spread Widening</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-outline">ENGINE_STATE:</span>
          <span className="text-xs text-tertiary font-mono tabular-nums">OPTIMAL</span>
          <span className="text-xs text-on-surface font-mono tabular-nums">SCANNING 402 TICKERS...</span>
        </div>
        {/* Duplicate for seamless loop if needed, but the scroll animation here is simple */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-outline">NY-ARBITRAGE-DESK:</span>
          <span className="text-xs text-primary font-mono tabular-nums">LATENCY: 0.12ms</span>
          <span className="text-xs text-tertiary font-mono tabular-nums">CONNECTED: WS_204</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-outline">LATEST_SIGNAL:</span>
          <span className="text-xs text-on-surface font-mono tabular-nums">SAVE Vol: +12%</span>
          <span className="text-xs text-error font-mono tabular-nums">CPRI Spread Widening</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-outline">ENGINE_STATE:</span>
          <span className="text-xs text-tertiary font-mono tabular-nums">OPTIMAL</span>
          <span className="text-xs text-on-surface font-mono tabular-nums">SCANNING 402 TICKERS...</span>
        </div>
      </div>
    </div>
  );
};
