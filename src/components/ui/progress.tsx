'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils/cn';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  /** Show percentage label */
  showLabel?: boolean;
  /** Color variant */
  variant?: 'teal' | 'indigo' | 'mly' | 'harbor' | 'green';
}

const variantColors = {
  teal: 'bg-gradient-to-r from-teal-500 to-teal-400',
  indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-400',
  mly: 'bg-gradient-to-r from-mly-500 to-mly-400',
  harbor: 'bg-gradient-to-r from-harbor-600 to-harbor-500',
  green: 'bg-gradient-to-r from-green-500 to-green-400',
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, showLabel, variant = 'teal', ...props }, ref) => (
  <div className={cn('relative', showLabel && 'flex items-center gap-3')}>
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-harbor-800', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out',
          variantColors[variant],
          indicatorClassName
        )}
        style={{ width: `${value || 0}%` }}
      />
    </ProgressPrimitive.Root>
    {showLabel && (
      <span className="text-xs font-medium tabular-nums text-gray-600 dark:text-gray-400 shrink-0 min-w-[2.5rem] text-right">
        {Math.round(value || 0)}%
      </span>
    )}
  </div>
));
Progress.displayName = 'Progress';

export { Progress };
