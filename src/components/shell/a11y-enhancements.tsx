'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Accessibility enhancements applied globally:
 * - Skip to content link
 * - Route change announcer for screen readers
 * - Focus management on navigation
 * - Reduced motion detection
 * - High contrast support
 */
export function A11yEnhancements() {
  const pathname = usePathname();

  // Announce route changes to screen readers
  useEffect(() => {
    const announcer = document.getElementById('route-announcer');
    if (announcer) {
      const pageName = pathname.split('/').filter(Boolean).pop() || 'Home';
      announcer.textContent = `Navigated to ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`;
    }

    // Move focus to main content on navigation
    const main = document.querySelector('main');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
      // Remove tabindex after focus (prevent tab-trapping)
      setTimeout(() => main.removeAttribute('tabindex'), 100);
    }
  }, [pathname]);

  // Apply reduced-motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = (e: MediaQueryListEvent | MediaQueryList) => {
      document.documentElement.classList.toggle('reduce-motion', e.matches);
    };
    apply(mediaQuery);
    mediaQuery.addEventListener('change', apply);
    return () => mediaQuery.removeEventListener('change', apply);
  }, []);

  // Apply high-contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    const apply = (e: MediaQueryListEvent | MediaQueryList) => {
      document.documentElement.classList.toggle('high-contrast', e.matches);
    };
    apply(mediaQuery);
    mediaQuery.addEventListener('change', apply);
    return () => mediaQuery.removeEventListener('change', apply);
  }, []);

  return (
    <>
      {/* Skip to content link — visible on focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-harbor-800 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        Skip to main content
      </a>

      {/* Screen reader route announcer (aria-live region) */}
      <div
        id="route-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
