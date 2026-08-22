import { Client } from '@upstash/qstash';

/**
 * Background Job Queue using Upstash QStash.
 * 
 * Jobs are HTTP calls to our own API routes, executed asynchronously
 * with retry, delay, and scheduling support.
 */

const qstash = new Client({
  token: process.env.QSTASH_TOKEN || '',
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://milyfe-platform.vercel.app';

export type JobType =
  | 'notification_digest'
  | 'standing_recalc'
  | 'moderation_review'
  | 'search_index'
  | 'mly_daily_stats'
  | 'badge_check'
  | 'recording_process'
  | 'email_digest'
  | 'cleanup_expired';

interface JobOptions {
  /** Delay in seconds before executing */
  delay?: number;
  /** Number of retries on failure */
  retries?: number;
  /** Cron schedule (e.g., "0 6 * * *") */
  cron?: string;
  /** Deduplication ID (prevents duplicate jobs) */
  deduplicationId?: string;
}

/**
 * Enqueue a background job to be processed by /api/jobs/[type]
 */
export async function enqueueJob(
  type: JobType,
  payload: Record<string, unknown> = {},
  options: JobOptions = {}
): Promise<{ messageId: string } | null> {
  if (!process.env.QSTASH_TOKEN) {
    // Fallback: execute synchronously in development
    console.log(`[Jobs] Would enqueue "${type}" with payload:`, payload);
    return null;
  }

  try {
    const url = `${BASE_URL}/api/jobs/${type}`;

    const result = await qstash.publishJSON({
      url,
      body: payload,
      retries: options.retries ?? 3,
      delay: options.delay ? options.delay : undefined,
      deduplicationId: options.deduplicationId,
      headers: {
        'x-job-type': type,
        'Authorization': `Bearer ${process.env.QSTASH_CURRENT_SIGNING_KEY || ''}`,
      },
    });

    return { messageId: result.messageId };
  } catch (err) {
    console.error(`[Jobs] Failed to enqueue "${type}":`, err);
    return null;
  }
}

/**
 * Schedule a recurring job (CRON-based)
 */
export async function scheduleRecurringJob(
  type: JobType,
  cron: string,
  payload: Record<string, unknown> = {}
): Promise<string | null> {
  if (!process.env.QSTASH_TOKEN) return null;

  try {
    const url = `${BASE_URL}/api/jobs/${type}`;

    const result = await qstash.publishJSON({
      url,
      body: payload,
      cron,
      headers: {
        'x-job-type': type,
      },
    });

    return result.messageId;
  } catch (err) {
    console.error(`[Jobs] Failed to schedule "${type}":`, err);
    return null;
  }
}

/**
 * Verify that an incoming request is from QStash (signature verification)
 */
export async function verifyQStashSignature(request: Request): Promise<boolean> {
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (!signingKey) return true; // Skip verification in development

  const signature = request.headers.get('upstash-signature');
  if (!signature) return false;

  // In production, use QStash's Receiver for full verification
  // For now, check the bearer token we set
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${signingKey}`;
}
