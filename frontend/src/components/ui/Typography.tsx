import * as React from 'react';
import { cn } from '../../lib/utils';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'display' | 'h1' | 'h2' | 'body' | 'label' | 'ticker';
  as?: React.ElementType;
  tabular?: boolean;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body', as: Component = 'p', tabular = false, ...props }, ref) => {
    const variantClasses = {
      display: 'font-headline text-[3.5rem] font-bold tracking-tight leading-none',
      h1: 'font-headline text-5xl font-bold tracking-tight',
      h2: 'font-headline text-2xl font-bold',
      body: 'font-body text-base',
      label: 'font-label text-[10px] font-bold uppercase tracking-[0.2em] text-outline',
      ticker: 'font-label text-[0.6875rem] font-bold uppercase tracking-wider',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          variantClasses[variant],
          tabular && 'tabular-nums',
          className
        )}
        {...props}
      />
    );
  }
);

Typography.displayName = 'Typography';
