import * as React from 'react';
import { Button, type ButtonProps } from '../ui/button';
import { cn } from '../../lib/utils';

export function SecondaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        'w-full justify-center rounded-full border-slate-200/80 bg-white/90 text-slate-900 shadow-card/40 transition-colors transition-transform duration-150 ease-out hover:bg-slate-50 active:scale-[0.97]',
        className
      )}
      {...props}
    />
  );
}
