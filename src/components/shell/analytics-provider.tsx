'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, trackEvent } from '@/lib/analytics/posthog';

/**
 * Analytics provider — initializes PostHog and tracks page views.
 * Privacy-respecting: no cookies, respects DNT, opt-out supported.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      trackEvent('$pageview', { path: pathname });
    }
  }, [pathname]);

  return <>{children}</>;
}
