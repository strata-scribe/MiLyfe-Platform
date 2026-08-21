'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/home', icon: '🏠', label: 'Home' },
  { href: '/city', icon: '🏛️', label: 'City' },
  { href: '/life', icon: '📚', label: 'Life' },
  { href: '/pocket', icon: '💰', label: 'Pocket' },
  { href: '/you', icon: '👤', label: 'You' },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    if (href === '/city') return pathname.startsWith('/city') || pathname.startsWith('/govern') || pathname.startsWith('/map');
    if (href === '/life') return pathname.startsWith('/life') || pathname.startsWith('/health') || pathname.startsWith('/learn') || pathname.startsWith('/career') || pathname.startsWith('/family') || pathname.startsWith('/dev');
    if (href === '/pocket') return pathname.startsWith('/pocket') || pathname.startsWith('/shop') || pathname.startsWith('/jobs') || pathname.startsWith('/wallet');
    if (href === '/you') return pathname.startsWith('/you') || pathname.startsWith('/profile') || pathname.startsWith('/vault') || pathname.startsWith('/connect') || pathname.startsWith('/safety') || pathname.startsWith('/media');
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-harbor-950/95 backdrop-blur-lg border-t border-gray-100 dark:border-harbor-800"
      role="navigation"
      aria-label="Main navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all',
                active
                  ? 'text-teal-500 scale-105'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 active:scale-95'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
