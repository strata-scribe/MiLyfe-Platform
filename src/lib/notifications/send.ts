import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NotificationPayload, BulkNotificationPayload } from './index';

/**
 * Server-side notification sender.
 * Use this in API routes and server actions.
 * Handles: DB insert + push + email based on user preferences.
 */

function getSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
}

/**
 * Send a notification to a single user
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const supabase = getSupabase();

  // 1. Insert into notifications table (in-app, real-time via Supabase)
  await supabase.from('notifications').insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link,
    metadata: payload.metadata || {},
  });

  // 2. Check user preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', payload.userId)
    .single();

  const categories = prefs?.categories as Record<string, boolean> | null;
  const categoryEnabled = !categories || categories[payload.type] !== false;

  if (!categoryEnabled) return;

  // 3. Web Push (if enabled and subscriptions exist)
  if (prefs?.push_enabled !== false) {
    await sendPushNotification(payload);
  }

  // 4. Email (if enabled and instant)
  if (prefs?.email_enabled && prefs?.email_digest === 'instant') {
    await sendEmailNotification(payload);
  }
}

/**
 * Send notifications to multiple users at once
 */
export async function sendBulkNotifications(payload: BulkNotificationPayload): Promise<void> {
  const supabase = getSupabase();

  // Batch insert (max 1000 at a time)
  const notifications = payload.userIds.map((userId) => ({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link,
    metadata: payload.metadata || {},
  }));

  // Insert in chunks of 500
  for (let i = 0; i < notifications.length; i += 500) {
    const chunk = notifications.slice(i, i + 500);
    await supabase.from('notifications').insert(chunk);
  }

  // Push notifications for users who have them enabled
  // In production, this would be queued via background job
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth_key')
    .in('user_id', payload.userIds.slice(0, 100)); // Limit for performance

  if (subs && subs.length > 0) {
    await Promise.allSettled(
      subs.map((sub) => sendPushToSubscription(sub, payload.title, payload.body, payload.link))
    );
  }
}

/**
 * Send Web Push to all subscriptions for a user
 */
async function sendPushNotification(payload: NotificationPayload): Promise<void> {
  const supabase = getSupabase();

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', payload.userId);

  if (!subs || subs.length === 0) return;

  await Promise.allSettled(
    subs.map((sub) => sendPushToSubscription(sub, payload.title, payload.body, payload.link))
  );
}

/**
 * Send push to a specific subscription endpoint
 */
async function sendPushToSubscription(
  sub: { endpoint: string; p256dh: string; auth_key: string },
  title: string,
  body: string,
  link?: string
): Promise<void> {
  try {
    const webpush = await import('web-push');

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) return;

    webpush.setVapidDetails(
      'mailto:support@milyfe.fun',
      vapidPublicKey,
      vapidPrivateKey
    );

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_key },
      },
      JSON.stringify({
        title,
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: link || '/notifications' },
      })
    );
  } catch {
    // Subscription may be expired — could clean up here
  }
}

/**
 * Send email notification via Resend
 */
async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('id', payload.userId)
    .single();

  if (!profile?.email) return;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: 'MiLyfe <notifications@milyfe.fun>',
      to: profile.email,
      subject: payload.title,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://milyfe-platform.vercel.app/logo.png" alt="MiLyfe" style="height: 32px;" />
          </div>
          <h2 style="color: #1e3a6e; margin: 0 0 8px;">${payload.title}</h2>
          <p style="color: #4a5568; line-height: 1.6;">${payload.body}</p>
          ${payload.link ? `<a href="https://milyfe-platform.vercel.app${payload.link}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #1e3a6e; color: white; text-decoration: none; border-radius: 8px;">View in MiLyfe</a>` : ''}
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #a0aec0;">
            You received this because notifications are enabled. 
            <a href="https://milyfe-platform.vercel.app/notifications/preferences" style="color: #4299e1;">Manage preferences</a>
          </p>
        </div>
      `,
    });
  } catch {
    // Email send failed — non-critical
  }
}
