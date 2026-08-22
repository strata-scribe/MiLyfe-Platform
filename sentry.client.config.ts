import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions for free tier

  // Session Replay (free tier: 50 sessions/month)
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 0.5,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',

  // Ignore common non-actionable errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'Load failed',
    'NetworkError',
    'AbortError',
    'ChunkLoadError',
  ],

  beforeSend(event) {
    // Don't send PII to Sentry
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
