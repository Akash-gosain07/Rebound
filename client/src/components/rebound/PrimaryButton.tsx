import * as React from 'react';
import { Button, type ButtonProps } from '../ui/button';
import { cn } from '../../lib/utils';

export function PrimaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        'w-full justify-center rounded-full shadow-soft transition-transform duration-150 ease-out active:scale-[0.97]',
        className
      )}
      {...props}
    />
  );
}
