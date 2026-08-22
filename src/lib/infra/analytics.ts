/**
 * MiLyfe Analytics — Self-hosted replacement for PostHog.
 * Tracks events to Supabase `analytics_events` table.
 * Zero external dependencies. Full data ownership.
 * 
 * Usage:
 * ```ts
 * import { track, identify, pageView } from '@/lib/infra/analytics';
 * track('button_clicked', { button: 'create_post', page: '/forum' });
 * pageView('/forum');
 * identify(userId, { plan: 'free', city: 'Jacksonville' });
 * ```
 */

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  user_id: string | null;
  session_id: string;
  page_url: string | null;
  referrer: string | null;
  timestamp: string;
  device: string | null;
}

let SESSION_ID = '';
let USER_ID: string | null = null;
const EVENT_BUFFER: AnalyticsEvent[] = [];
let FLUSH_TIMER: ReturnType<typeof setTimeout> | null = null;

function getSessionId(): string {
  if (SESSION_ID) return SESSION_ID;
  if (typeof window !== 'undefined') {
    SESSION_ID = sessionStorage.getItem('milyfe_session') || crypto.randomUUID();
    sessionStorage.setItem('milyfe_session', SESSION_ID);
  } else {
    SESSION_ID = crypto.randomUUID();
  }
  return SESSION_ID;
}

function getDevice(): string | null {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

/**
 * Identify a user for analytics.
 */
export function identify(userId: string, traits?: Record<string, any>) {
  USER_ID = userId;
  if (traits) {
    track('$identify', traits);
  }
}

/**
 * Track a custom event.
 */
export function track(event: string, properties: Record<string, any> = {}) {
  const entry: AnalyticsEvent = {
    event,
    properties,
    user_id: USER_ID,
    session_id: getSessionId(),
    page_url: typeof window !== 'undefined' ? window.location.href : null,
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    timestamp: new Date().toISOString(),
    device: getDevice(),
  };

  EVENT_BUFFER.push(entry);

  // Flush every 10 events or after 10 seconds
  if (EVENT_BUFFER.length >= 10) {
    flushEvents();
  } else if (!FLUSH_TIMER) {
    FLUSH_TIMER = setTimeout(flushEvents, 10000);
  }
}

/**
 * Track a page view.
 */
export function pageView(path?: string) {
  track('$pageview', { path: path || (typeof window !== 'undefined' ? window.location.pathname : '') });
}

/**
 * Flush events to Supabase.
 */
async function flushEvents() {
  if (FLUSH_TIMER) { clearTimeout(FLUSH_TIMER); FLUSH_TIMER = null; }
  if (EVENT_BUFFER.length === 0) return;

  const batch = EVENT_BUFFER.splice(0, EVENT_BUFFER.length);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(batch),
    });
  } catch {
    // Silent fail — analytics should never break the app
  }
}

/**
 * Flush on page unload.
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeunload', flushEvents);
  pageView();
}
