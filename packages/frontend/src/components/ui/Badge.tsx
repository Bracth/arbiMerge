import * as React from 'react';
import { cn } from '../../lib/utils';
import { type LucideIcon } from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'subtle' | 'outline';
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'gray';
  icon?: LucideIcon;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'subtle', color = 'secondary', icon: Icon, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2 py-1 text-xs font-bold tracking-tighter uppercase border-0';
    
    const variantClasses = {
      solid: {
        primary: 'bg-primary text-on-primary',
        secondary: 'bg-secondary text-on-secondary',
        tertiary: 'bg-tertiary text-on-tertiary',
        error: 'bg-error text-on-error',
        gray: 'bg-surface-container-highest text-on-surface',
      },
      subtle: {
        primary: 'bg-primary-container text-on-primary-container',
        secondary: 'bg-secondary-container text-on-secondary-container',
        tertiary: 'bg-tertiary-container text-on-tertiary-container',
        error: 'bg-error-container text-on-error-container',
        gray: 'bg-surface-container-high text-on-surface-variant',
      },
      outline: {
        primary: 'border border-primary text-primary',
        secondary: 'border border-secondary text-secondary',
        tertiary: 'border border-tertiary text-tertiary',
        error: 'border border-error text-error',
        gray: 'border border-outline-variant text-outline',
      },
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant][color], className)}
        {...props}
      >
        {Icon && <Icon className="w-3 h-3" />}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
