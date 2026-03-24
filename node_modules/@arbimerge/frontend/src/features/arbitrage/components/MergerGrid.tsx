import React from 'react';
import type { Merger } from '../types';
import { MergerCard } from './MergerCard';

interface MergerGridProps {
  mergers: Merger[];
}

export const MergerGrid: React.FC<MergerGridProps> = ({ mergers }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {mergers.map((merger) => (
        <MergerCard key={merger.id} merger={merger} />
      ))}
    </div>
  );
};
