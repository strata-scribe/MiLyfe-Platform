/**
 * MiLyfe Error Tracker — Self-hosted replacement for Sentry.
 * Logs errors to Supabase `error_logs` table + console.
 * Zero external dependencies. You own all error data.
 * 
 * Usage:
 * ```ts
 * import { trackError } from '@/lib/infra/error-tracker';
 * try { ... } catch (e) { trackError(e, { context: 'payment' }); }
 * ```
 */

interface ErrorLog {
  message: string;
  stack: string | null;
  context: string | null;
  url: string | null;
  user_id: string | null;
  metadata: Record<string, any>;
  severity: 'error' | 'warning' | 'fatal';
  timestamp: string;
}

const ERROR_BUFFER: ErrorLog[] = [];
let FLUSH_TIMER: ReturnType<typeof setTimeout> | null = null;

/**
 * Track an error. Buffers and flushes to Supabase in batches.
 */
export function trackError(
  error: unknown,
  options?: { context?: string; severity?: 'error' | 'warning' | 'fatal'; metadata?: Record<string, any>; userId?: string }
) {
  const err = error instanceof Error ? error : new Error(String(error));
  const severity = options?.severity || 'error';

  // Always log to console in dev
  if (process.env.NODE_ENV === 'development') {
    console.error(`[MiLyfe ${severity.toUpperCase()}]`, err.message, options?.context || '');
  }

  const entry: ErrorLog = {
    message: err.message,
    stack: err.stack || null,
    context: options?.context || null,
    url: typeof window !== 'undefined' ? window.location.href : null,
    user_id: options?.userId || null,
    metadata: options?.metadata || {},
    severity,
    timestamp: new Date().toISOString(),
  };

  ERROR_BUFFER.push(entry);

  // Flush after 5 seconds or when buffer hits 10
  if (ERROR_BUFFER.length >= 10) {
    flushErrors();
  } else if (!FLUSH_TIMER) {
    FLUSH_TIMER = setTimeout(flushErrors, 5000);
  }
}

/**
 * Flush buffered errors to Supabase.
 */
async function flushErrors() {
  if (FLUSH_TIMER) { clearTimeout(FLUSH_TIMER); FLUSH_TIMER = null; }
  if (ERROR_BUFFER.length === 0) return;

  const batch = ERROR_BUFFER.splice(0, ERROR_BUFFER.length);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    await fetch(`${supabaseUrl}/rest/v1/error_logs`, {
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
    // If Supabase fails, don't lose errors — store in localStorage
    if (typeof window !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('milyfe_error_buffer') || '[]');
      localStorage.setItem('milyfe_error_buffer', JSON.stringify([...stored, ...batch].slice(-50)));
    }
  }
}

/**
 * Global window error handler — catches unhandled errors.
 */
export function initErrorTracking() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    trackError(event.error || event.message, { context: 'window.onerror', severity: 'error' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, { context: 'unhandledrejection', severity: 'error' });
  });
}
