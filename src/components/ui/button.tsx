import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-teal-500 text-white hover:bg-teal-600 shadow-sm',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
        outline: 'border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-900 hover:bg-gray-50 dark:hover:bg-harbor-800 text-harbor-800 dark:text-white',
        secondary: 'bg-gray-100 dark:bg-harbor-800 text-harbor-800 dark:text-white hover:bg-gray-200 dark:hover:bg-harbor-700',
        ghost: 'hover:bg-gray-100 dark:hover:bg-harbor-800 text-harbor-800 dark:text-white',
        link: 'text-teal-600 underline-offset-4 hover:underline',
        mly: 'bg-mly-500 text-harbor-900 hover:bg-mly-600 shadow-sm font-bold',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
