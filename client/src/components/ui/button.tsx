import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-5 py-2.5',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-button hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-primary active:scale-[0.98]',
        outline:
          'border-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-200',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
        accent:
          'bg-accent text-white shadow-button hover:bg-accent-dark hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-accent active:scale-[0.98]'
      },
      size: {
        default: 'h-10 px-5',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0 justify-center'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> { }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
