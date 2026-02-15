import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  maxWidthClassName?: string;
}

export function Dialog({ open, onOpenChange, title, children, maxWidthClassName = 'max-w-lg' }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => onOpenChange(false)}>
      <div
        className={cn('w-full rounded-2xl border border-white/10 bg-[#151B2E] p-8 shadow-soft-xl ring-1 ring-white/5', maxWidthClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          <button className="text-slate-500 hover:text-white transition-colors" onClick={() => onOpenChange(false)} aria-label="Close modal">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
