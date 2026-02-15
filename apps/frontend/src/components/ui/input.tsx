import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40',
        className,
      )}
      {...props}
    />
  );
}
