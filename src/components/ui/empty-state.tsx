import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** Emoji or icon to display */
  icon?: string;
  /** Main heading */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Compact mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Reusable empty state component.
 * Use when a list/section has no data yet.
 */
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('card text-center', compact ? 'py-6' : 'py-8', className)}>
      <p className={cn('mb-2', compact ? 'text-xl' : 'text-3xl')}>{icon}</p>
      <p className={cn('font-medium text-harbor-800 dark:text-white', compact ? 'text-xs' : 'text-sm')}>
        {title}
      </p>
      {description && (
        <p className={cn('text-gray-500 mt-1', compact ? 'text-[10px]' : 'text-xs')}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex gap-2 justify-center mt-4">
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button size="sm">{action.label}</Button>
              </Link>
            ) : (
              <Button size="sm" onClick={action.onClick}>{action.label}</Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button size="sm" variant="outline">{secondaryAction.label}</Button>
              </Link>
            ) : (
              <Button size="sm" variant="outline" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
