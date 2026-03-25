import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'primary-gradient text-[#1000A9] hover:opacity-95 shadow-glow transition-all active:scale-[0.985]',
  secondary: 'surface-elevated text-text hover:bg-[#3d3c3e] shadow-soft transition-all active:scale-[0.985]',
  outline: 'bg-transparent text-text border border-border/15 hover:bg-bg-light/80 hover:border-border/30 transition-all active:scale-[0.985]',
  ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-white/5 transition-all active:scale-[0.985]',
  destructive: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/15 transition-all active:scale-[0.985]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[11px] uppercase tracking-[0.14em]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-sm',
  icon: 'h-10 w-10 p-0',
};

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
