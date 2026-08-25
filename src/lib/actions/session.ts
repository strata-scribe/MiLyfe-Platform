'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Sign out all other sessions (keep current one active).
 * Uses Supabase's scope: 'others' to revoke all except current.
 */
export async function signOutOtherSessions() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) return { error: error.message };

  revalidatePath('/profile');
  return { success: true };
}

/**
 * Sign out everywhere (including current session).
 */
export async function signOutEverywhere() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) return { error: error.message };

  return { success: true, redirect: '/login' };
}

/**
 * Change password and revoke other sessions.
 */
export async function changePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) return { error: updateError.message };

  // Revoke all other sessions after password change
  await supabase.auth.signOut({ scope: 'others' });

  revalidatePath('/profile');
  return { success: true };
}
