import { createServiceSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateVerificationQuest } from '@/lib/mi-source';

/**
 * Resource Freshness Cron
 *
 * Runs daily. Checks community_resources for stale entries and:
 * 1. Marks resources as 'stale' when their expires_at has passed
 * 2. Generates verification quests for stale resources
 *
 * This ensures the Street → Resources tab always shows freshness warnings
 * and community members are incentivized to verify information.
 */

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const now = new Date().toISOString();

  // Find resources that have expired
  const { data: staleResources, error: fetchError } = await supabase
    .from('community_resources')
    .select('id, name, category, address, phone, status, expires_at')
    .eq('status', 'active')
    .lt('expires_at', now);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!staleResources || staleResources.length === 0) {
    return NextResponse.json({ marked_stale: 0, quests_created: 0 });
  }

  let markedStale = 0;
  let questsCreated = 0;

  for (const resource of staleResources) {
    // Mark as stale
    await supabase
      .from('community_resources')
      .update({ status: 'stale' })
      .eq('id', resource.id);
    markedStale++;

    // Check if there's already a verification quest for this resource
    const { data: existingQuest } = await supabase
      .from('quests')
      .select('id')
      .eq('status', 'open')
      .ilike('title', `%${resource.name}%`)
      .limit(1)
      .maybeSingle();

    if (!existingQuest) {
      // Generate verification quest
      const quest = generateVerificationQuest({
        id: resource.id,
        name: resource.name,
        category: resource.category,
        address: resource.address,
        phone: resource.phone,
      });

      const { error: questError } = await supabase.from('quests').insert({
        creator_id: '00000000-0000-0000-0000-000000000000', // System user
        title: quest.title,
        description: quest.description,
        category: quest.category as any,
        reward_mly: quest.reward_mly,
        reward_source: 'treasury',
        difficulty: 'easy',
        time_estimate_minutes: 15,
        location_text: resource.address,
        status: 'open',
        requires_verification: false, // Self-verifying (update resource on completion)
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (!questError) {
        questsCreated++;
      }
    }
  }

  return NextResponse.json({
    marked_stale: markedStale,
    quests_created: questsCreated,
    total_checked: staleResources.length,
    timestamp: now,
  });
}
