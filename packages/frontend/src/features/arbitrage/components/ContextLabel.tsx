import React from 'react';

interface ContextLabelProps {
  children: React.ReactNode;
  className?: string;
  italic?: boolean;
}

export const ContextLabel: React.FC<ContextLabelProps> = ({ 
  children, 
  className = '', 
  italic = false 
}) => {
  return (
    <span className={`text-on-surface-variant text-[10px] leading-tight ${italic ? 'italic' : ''} ${className}`}>
      {children}
    </span>
  );
};
