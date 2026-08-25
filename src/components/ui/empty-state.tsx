import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Optional illustration variant */
  variant?: 'default' | 'community' | 'learn' | 'connect';
}

export function EmptyState({ icon: Icon, title, description, action, className, variant = 'default' }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in', className)}>
      {/* SVG illustration ring */}
      <div className="relative mb-5">
        {/* Decorative rings */}
        <div className="absolute inset-0 -m-3 rounded-full border-2 border-dashed border-gray-200 dark:border-harbor-700 opacity-50 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-0 -m-6 rounded-full border border-dashed border-gray-100 dark:border-harbor-800 opacity-30 animate-[spin_30s_linear_infinite_reverse]" />
        {/* Icon container */}
        <div className={cn(
          'relative rounded-2xl p-5 shadow-sm',
          variant === 'community' && 'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/10',
          variant === 'learn' && 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/10',
          variant === 'connect' && 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/10',
          variant === 'default' && 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-harbor-800 dark:to-harbor-900',
        )}>
          <Icon className={cn(
            'h-8 w-8',
            variant === 'community' && 'text-teal-500',
            variant === 'learn' && 'text-indigo-500',
            variant === 'connect' && 'text-purple-500',
            variant === 'default' && 'text-gray-400 dark:text-gray-500',
          )} aria-hidden="true" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-harbor-800 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4 leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}
