import React from 'react';

interface GlassCardProps {
  label: string;
  value: string;
  change: string;
  changeColor?: 'positive' | 'negative';
  highlight?: boolean;
  children?: React.ReactNode;
}

export default function GlassCard({
  label,
  value,
  change,
  changeColor = 'positive',
  highlight = false,
  children,
}: GlassCardProps) {
  return (
    <div
      className={`glass p-base rounded-xl space-y-xs ${
        highlight ? 'border-l-4 border-primary-fixed' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-label-sm text-on-surface-variant">{label}</span>
        <span
          className={`font-data-mono text-label-sm ${
            changeColor === 'positive' ? 'text-primary-fixed-dim' : 'text-secondary'
          }`}
        >
          {changeColor === 'positive' ? '+' : ''}{change}
        </span>
      </div>
      <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
        {value}
      </div>
      {children && <div className="h-8 w-full overflow-hidden">{children}</div>}
    </div>
  );
}
