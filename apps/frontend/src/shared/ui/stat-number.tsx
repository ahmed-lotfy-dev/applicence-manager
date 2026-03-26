import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface StatNumberProps extends HTMLAttributes<HTMLSpanElement> {
  value: number;
  currency?: string | null;
  showCurrency?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function StatNumber({
  value,
  currency,
  showCurrency = false,
  size = 'md',
  className,
  ...props
}: StatNumberProps) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);

  const displayValue = showCurrency
    ? `${currency?.trim() || 'EGP'} ${formatted}`
    : formatted;

  return (
    <span
      className={cn(
        'metric-value inline-block truncate tabular-nums text-white direction-ltr',
        sizeClasses[size],
        className,
      )}
      title={displayValue}
      {...props}
    >
      {displayValue}
    </span>
  );
}
