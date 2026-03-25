import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'muted';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/15',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/15',
  warning: 'bg-warning/12 text-warning border-warning/15',
  danger: 'bg-danger/12 text-danger border-danger/15',
  muted: 'bg-white/5 text-text-muted border-border/12',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', variantClasses[variant], className)}
      {...props}
    />
  );
}
