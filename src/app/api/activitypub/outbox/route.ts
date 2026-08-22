import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * ActivityPub Outbox — serves a user's public activities.
 * GET /api/activitypub/outbox?user=USER_ID
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user');

  if (!userId) return NextResponse.json({ error: 'Missing user param' }, { status: 400 });

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const baseUrl = 'https://milyfe-platform.vercel.app';

  // Get user's actor info
  const { data: actor } = await supabase.from('ap_actors').select('*').eq('user_id', userId).single();
  if (!actor) return NextResponse.json({ error: 'Actor not found' }, { status: 404 });

  // Get user's recent public posts
  const { data: posts } = await supabase
    .from('feed_posts')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const items = (posts || []).map((post) => ({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Create',
    actor: actor.ap_id,
    published: post.created_at,
    object: {
      type: 'Note',
      id: `${baseUrl}/posts/${post.id}`,
      content: post.content,
      attributedTo: actor.ap_id,
      published: post.created_at,
      to: ['https://www.w3.org/ns/activitystreams#Public'],
    },
  }));

  const outbox = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${baseUrl}/api/activitypub/outbox?user=${userId}`,
    totalItems: items.length,
    orderedItems: items,
  };

  return NextResponse.json(outbox, {
    headers: { 'Content-Type': 'application/activity+json' },
  });
}
