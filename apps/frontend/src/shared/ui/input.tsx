import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full h-11 rounded-2xl border border-border/15 bg-bg-light px-4 text-sm text-text placeholder:text-text-muted/45 transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40',
        className,
      )}
      {...props}
    />
  );
}
