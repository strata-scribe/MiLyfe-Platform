import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * ActivityPub Inbox — receives activities from federated servers.
 * Handles: Follow, Undo(Follow), Like, Announce, Create(Note)
 */
export async function POST(request: Request) {
  const body = await request.json();
  const activity = body;

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  switch (activity.type) {
    case 'Follow': {
      // Someone wants to follow a MiLyfe user
      const targetApId = activity.object;
      const followerApId = activity.actor;

      // Find our user by AP ID
      const { data: actor } = await supabase
        .from('ap_actors')
        .select('user_id')
        .eq('ap_id', targetApId)
        .single();

      if (!actor) return NextResponse.json({ error: 'Actor not found' }, { status: 404 });

      // Auto-accept follow
      await supabase.from('ap_followers').upsert(
        { actor_id: actor.user_id, follower_ap_id: followerApId, accepted: true },
        { onConflict: 'actor_id,follower_ap_id' }
      );

      // Send Accept activity back
      const acceptActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Accept',
        actor: targetApId,
        object: activity,
      };

      // Deliver Accept to follower's inbox
      try {
        const followerInbox = followerApId.replace('/users/', '/inbox/');
        await fetch(followerInbox, {
          method: 'POST',
          headers: { 'Content-Type': 'application/activity+json' },
          body: JSON.stringify(acceptActivity),
        });
      } catch {
        // Delivery failed — non-critical
      }

      return NextResponse.json({ status: 'accepted' });
    }

    case 'Undo': {
      if (activity.object?.type === 'Follow') {
        const targetApId = activity.object.object;
        const followerApId = activity.actor;

        const { data: actor } = await supabase
          .from('ap_actors')
          .select('user_id')
          .eq('ap_id', targetApId)
          .single();

        if (actor) {
          await supabase.from('ap_followers')
            .delete()
            .eq('actor_id', actor.user_id)
            .eq('follower_ap_id', followerApId);
        }
      }
      return NextResponse.json({ status: 'processed' });
    }

    case 'Like':
    case 'Announce':
    case 'Create': {
      // Log federated activity for future processing
      // In production, create notification or mirror post
      return NextResponse.json({ status: 'received' });
    }

    default:
      return NextResponse.json({ status: 'ignored' });
  }
}
