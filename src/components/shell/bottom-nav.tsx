'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, GraduationCap, Store, Landmark, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const MOBILE_NAV = [
  { href: '/wallet', label: 'Pocket', icon: Wallet },
  { href: '/learn', label: 'Learn', icon: GraduationCap },
  { href: '/street', label: 'Street', icon: Store },
  { href: '/governance', label: 'Voice', icon: Landmark },
  { href: '/profile', label: 'You', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-harbor-950 border-t border-gray-100 dark:border-harbor-800 safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl transition-colors',
                isActive
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-gray-400 dark:text-gray-500'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
