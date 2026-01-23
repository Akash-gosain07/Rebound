import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StatusBadge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-100',
        className
      )}
    >
      <ShieldCheck className="h-4 w-4" />
      {children}
    </span>
  );
}
