import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-950 px-4 py-3 text-sm ring-offset-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
