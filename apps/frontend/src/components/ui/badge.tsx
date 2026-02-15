import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'muted';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  muted: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', variantClasses[variant], className)}
      {...props}
    />
  );
}
