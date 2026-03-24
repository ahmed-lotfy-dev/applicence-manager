import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-white hover:bg-primary/90 shadow-soft transition-all active:scale-95',
  secondary: 'bg-cta text-white hover:bg-cta/90 shadow-soft transition-all active:scale-95',
  outline: 'bg-transparent text-text border border-border hover:bg-bg-light transition-all active:scale-95',
  ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-bg-light transition-all active:scale-95',
  destructive: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all active:scale-95',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-9 w-9 p-0',
};

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
