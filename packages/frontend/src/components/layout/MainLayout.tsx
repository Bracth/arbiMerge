import React from 'react';
import { Settings, Bell } from 'lucide-react';
import { Typography } from '../ui/Typography';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary/30">
      <header className="flex items-center justify-between w-full h-20 px-8 max-w-none bg-surface font-headline antialiased">
        <Typography variant="h2" className="text-2xl font-bold tracking-tighter text-primary">
          ArbiMerge
        </Typography>
        <div className="hidden md:flex items-center gap-6">
          <Settings className="w-6 h-6 text-outline-variant hover:text-primary cursor-pointer transition-colors" />
          <Bell className="w-6 h-6 text-outline-variant hover:text-primary cursor-pointer transition-colors" />
        </div>
      </header>
      {children}
    </div>
  );
};
