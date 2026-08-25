'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const reportSchema = z.object({
  resource_type: z.enum(['profile', 'listing', 'post', 'proposal', 'comment', 'message']),
  resource_id: z.string().uuid(),
  reason: z.enum([
    'spam',
    'harassment',
    'hate_speech',
    'misinformation',
    'scam',
    'inappropriate_content',
    'impersonation',
    'other',
  ]),
  details: z.string().max(500).optional().default(''),
});

export type ReportInput = z.infer<typeof reportSchema>;

export async function submitReport(input: ReportInput) {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Prevent duplicate reports
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('resource_type', parsed.data.resource_type)
    .eq('resource_id', parsed.data.resource_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return { error: 'You have already reported this content' };
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    resource_type: parsed.data.resource_type,
    resource_id: parsed.data.resource_id,
    reason: parsed.data.reason,
    details: parsed.data.details,
    status: 'pending',
  });

  if (error) {
    // Table might not exist yet — create it
    if (error.code === '42P01') {
      return { error: 'Report system being set up. Please try again later.' };
    }
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}
