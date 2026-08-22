'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, pageView, identify } from '@/lib/infra/analytics';
import { initErrorTracking } from '@/lib/infra/error-tracker';
import { useAppStore } from '@/lib/store/app-store';

/**
 * Analytics & Error Tracking provider — fully self-hosted.
 * Uses Supabase as the data store. Zero external dependencies.
 * Privacy-respecting: no cookies sent to third parties. All data stays in your Supabase.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAppStore();

  useEffect(() => {
    initAnalytics();
    initErrorTracking();
  }, []);

  // Identify user when they sign in
  useEffect(() => {
    if (user) {
      identify(user.id, { display_name: user.display_name, city: user.city });
    }
  }, [user]);

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      pageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}
