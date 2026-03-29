import React from 'react';
import { cn } from '../../lib/utils';
import { Typography } from './Typography';

interface RadarSweepProps {
  className?: string;
  text?: string;
}

export const RadarSweep: React.FC<RadarSweepProps> = ({ 
  className,
  text = "ANALYZING DEAL METRICS..." 
}) => {
  return (
    <div className={cn("relative w-full h-[200px] bg-surface-container-low border border-surface-bright/50 overflow-hidden rounded font-mono flex items-center justify-center", className)}>
      {/* Background grid */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Skeleton Text Base */}
      <div className="absolute inset-x-8 inset-y-8 flex flex-col gap-3 opacity-20 pointer-events-none">
        <div className="h-2 bg-outline w-full rounded" />
        <div className="h-2 bg-outline w-11/12 rounded" />
        <div className="h-2 bg-outline w-full rounded" />
        <div className="h-2 bg-outline w-4/5 rounded" />
        <div className="h-2 bg-outline w-full rounded" />
        <div className="h-2 bg-outline w-3/4 rounded" />
      </div>

      {/* Radar scanning line */}
      <div 
        className="absolute inset-x-0 top-0 h-[100px] pointer-events-none animate-radar-scan origin-top"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(var(--primary-rgb), 0.1) 95%, rgba(var(--primary-rgb), 0.8) 100%)',
          borderBottom: '1px solid rgb(var(--primary-rgb))',
          boxShadow: '0 4px 10px rgba(var(--primary-rgb), 0.2)'
        }}
      />

      {/* Central Text */}
      <div className="z-10 bg-surface-container/80 backdrop-blur-sm px-4 py-2 border border-primary/30 rounded shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
        <Typography variant="body" className="text-primary font-bold text-xs tracking-[0.2em] animate-pulse">
          {text}
        </Typography>
      </div>
    </div>
  );
};
