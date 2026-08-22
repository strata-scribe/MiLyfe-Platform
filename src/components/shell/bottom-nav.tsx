'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/home', icon: '🏠', label: 'Home' },
  { href: '/city', icon: '🏛️', label: 'City' },
  { href: '/social', icon: '💬', label: 'Social' },
  { href: '/pocket', icon: '💰', label: 'Pocket' },
  { href: '/you', icon: '👤', label: 'You' },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    if (href === '/city') return pathname.startsWith('/city') || pathname.startsWith('/govern') || pathname.startsWith('/nav') || pathname.startsWith('/broadcast');
    if (href === '/social') return pathname.startsWith('/social') || pathname.startsWith('/forum') || pathname.startsWith('/connect') || pathname.startsWith('/feed') || pathname.startsWith('/news') || pathname.startsWith('/media');
    if (href === '/pocket') return pathname.startsWith('/pocket') || pathname.startsWith('/shop') || pathname.startsWith('/market') || pathname.startsWith('/jobs') || pathname.startsWith('/wallet') || pathname.startsWith('/auto');
    if (href === '/you') return pathname.startsWith('/you') || pathname.startsWith('/profile') || pathname.startsWith('/vault') || pathname.startsWith('/health') || pathname.startsWith('/twin') || pathname.startsWith('/privacy') || pathname.startsWith('/settings') || pathname.startsWith('/achievements');
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
