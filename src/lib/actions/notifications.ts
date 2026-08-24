'use server';

import { createServerSupabase } from '@/lib/supabase/server';

type NotificationType = 'info' | 'ubi' | 'social' | 'safety' | 'governance' | 'reward' | 'system';

interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/** Send a notification to a user (server-side) */
export async function sendNotification({ userId, type, title, body, link }: SendNotificationInput) {
  const supabase = createServerSupabase();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body: body || '',
    link: link || null,
  });

  if (error) return { error: error.message };
  return { success: true };
}

/** Mark a single notification as read */
export async function markNotificationRead(notificationId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  return { success: true };
}

/** Mark all notifications as read for the current user */
export async function markAllNotificationsRead() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  return { success: true };
}
