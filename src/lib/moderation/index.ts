import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { enqueueJob } from '@/lib/jobs/queue';

/**
 * Content Moderation Pipeline
 * 
 * Flow:
 * 1. User creates content → runs through AI pre-screen
 * 2. If flagged by AI → auto-hold for review
 * 3. If flagged by community → queued for review
 * 4. 3+ flags from different users → auto-escalate
 * 5. Review: admin/jury confirms or dismisses
 * 6. Action: warning, content removal, restriction, or dismissal
 */

export type ContentType = 'post' | 'comment' | 'message' | 'listing' | 'media' | 'profile' | 'recording';
export type FlagReason = 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'misinformation' | 'illegal' | 'other';

// Toxic keyword patterns (basic pre-screen — in production use AI model)
const TOXIC_PATTERNS = [
  /\b(kill|murder|shoot|bomb)\b.*\b(you|them|everyone)\b/i,
  /\b(n[i1]gg|f[a4]gg|k[i1]ke|sp[i1]c)\b/i,
  /\b(buy|sell)\b.*\b(gun|drug|meth|cocaine|heroin)\b/i,
];

const SPAM_PATTERNS = [
  /https?:\/\/\S+\s*https?:\/\/\S+\s*https?:\/\//i, // 3+ URLs
  /(.)\1{10,}/i, // 10+ repeated chars
  /\b(free money|earn fast|click here|limited time)\b/i,
];

/**
 * Pre-screen content before publishing.
 * Returns { safe, reason } — if not safe, content should be held.
 */
export function preScreenContent(text: string): { safe: boolean; reason?: string; confidence: number } {
  if (!text || text.trim().length === 0) return { safe: true, confidence: 1 };

  // Check toxic patterns
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'Potential hate speech or violent content detected', confidence: 0.8 };
    }
  }

  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'Potential spam detected', confidence: 0.7 };
    }
  }

  return { safe: true, confidence: 1 };
}

/**
 * Flag content for review (called by users)
 */
export async function flagContent(params: {
  reporterId: string;
  contentType: ContentType;
  contentId: string;
  reason: FlagReason;
  description?: string;
}): Promise<{ success: boolean; escalated: boolean }> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
    }
  );

  // Insert flag
  const { error } = await supabase.from('content_flags').insert({
    reporter_id: params.reporterId,
    content_type: params.contentType,
    content_id: params.contentId,
    reason: params.reason,
    description: params.description,
  });

  if (error) return { success: false, escalated: false };

  // Check if this content now has 3+ flags (auto-escalate)
  const { count } = await supabase
    .from('content_flags')
    .select('*', { count: 'exact', head: true })
    .eq('content_id', params.contentId)
    .eq('content_type', params.contentType)
    .eq('status', 'pending');

  const escalated = (count || 0) >= 3;

  if (escalated) {
    // Queue for moderation review
    await enqueueJob('moderation_review', {
      content_type: params.contentType,
      content_id: params.contentId,
      flag_count: count,
    });
  }

  return { success: true, escalated };
}

/**
 * Take moderation action on flagged content
 */
export async function moderateContent(params: {
  contentType: ContentType;
  contentId: string;
  action: 'remove' | 'warn' | 'dismiss';
  reviewerId: string;
  reason?: string;
}): Promise<void> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
    }
  );

  // Update all flags for this content
  await supabase.from('content_flags')
    .update({
      status: 'resolved',
      reviewed_by: params.reviewerId,
      action_taken: params.action,
    })
    .eq('content_id', params.contentId)
    .eq('content_type', params.contentType);

  if (params.action === 'remove') {
    // Remove the actual content based on type
    const tableMap: Record<ContentType, string> = {
      post: 'feed_posts',
      comment: 'feed_comments',
      message: 'messages',
      listing: 'shop_listings',
      media: 'media_content',
      profile: 'profiles',
      recording: 'community_recordings',
    };

    const table = tableMap[params.contentType];
    if (table && table !== 'profiles') {
      // For most content, we soft-delete by updating status
      if (table === 'media_content') {
        await supabase.from(table).update({ status: 'removed' }).eq('id', params.contentId);
      } else if (table === 'shop_listings') {
        await supabase.from(table).update({ available: false }).eq('id', params.contentId);
      } else if (table === 'community_recordings') {
        await supabase.from(table).update({ status: 'rejected' }).eq('id', params.contentId);
      } else {
        await supabase.from(table).delete().eq('id', params.contentId);
      }
    }
  }
}
