import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Colored ring around avatar */
  ring?: 'teal' | 'mly' | 'harbor' | 'green' | 'none';
  /** Show a status dot indicator */
  status?: 'online' | 'new' | 'none';
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

const ringMap = {
  teal: 'ring-2 ring-teal-400 ring-offset-2 ring-offset-white dark:ring-offset-harbor-950',
  mly: 'ring-2 ring-mly-400 ring-offset-2 ring-offset-white dark:ring-offset-harbor-950',
  harbor: 'ring-2 ring-harbor-400 ring-offset-2 ring-offset-white dark:ring-offset-harbor-950',
  green: 'ring-2 ring-green-400 ring-offset-2 ring-offset-white dark:ring-offset-harbor-950',
  none: '',
};

export function Avatar({ src, name, size = 'md', className, ring = 'none', status = 'none' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const baseClasses = cn('relative rounded-full', sizeMap[size], ringMap[ring], className);

  const statusDot = status !== 'none' && (
    <span
      className={cn(
        'absolute bottom-0 right-0 block rounded-full border-2 border-white dark:border-harbor-950',
        size === 'sm' ? 'h-2.5 w-2.5' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3',
        status === 'online' && 'bg-green-400',
        status === 'new' && 'bg-mly-400 animate-pulse-soft',
      )}
      aria-label={status === 'online' ? 'Online' : 'New citizen'}
    />
  );

  if (src) {
    return (
      <div className={cn('relative inline-block', sizeMap[size])}>
        <img
          src={src}
          alt={name}
          className={cn('rounded-full object-cover', sizeMap[size], ringMap[ring], className)}
        />
        {statusDot}
      </div>
    );
  }

  return (
    <div className={cn('relative inline-block', sizeMap[size])}>
      <div
        className={cn(
          'rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center',
          sizeMap[size],
          ringMap[ring],
          className
        )}
        aria-label={name}
      >
        {initials}
      </div>
      {statusDot}
    </div>
  );
}
