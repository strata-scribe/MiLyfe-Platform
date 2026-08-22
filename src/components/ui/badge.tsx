import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
        secondary: 'bg-gray-100 text-gray-600 dark:bg-harbor-800 dark:text-gray-400',
        destructive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        mly: 'bg-mly-100 text-mly-700 dark:bg-mly-900/30 dark:text-mly-400',
        outline: 'border border-gray-200 dark:border-harbor-700 text-gray-600 dark:text-gray-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
