'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/home', icon: '🏠', label: 'Home' },
  { href: '/city', icon: '🏛️', label: 'City' },
  { href: '/map', icon: '🗺️', label: 'Map' },
  { href: '/health', icon: '💚', label: 'Health' },
  { href: '/shop', icon: '🛍️', label: 'Shop' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-harbor-950/90 backdrop-blur-lg border-t border-gray-100 dark:border-harbor-800 safe-area-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all',
                isActive
                  ? 'text-teal-500 scale-110'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
