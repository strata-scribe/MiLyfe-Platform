import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * WebFinger endpoint for ActivityPub discovery.
 * Allows federated servers to look up MiLyfe users.
 * 
 * GET /.well-known/webfinger?resource=acct:username@milyfe.fun
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get('resource');

  if (!resource || !resource.startsWith('acct:')) {
    return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
  }

  const [username, domain] = resource.replace('acct:', '').split('@');
  if (domain !== 'milyfe.fun' && domain !== 'milyfe-platform.vercel.app') {
    return NextResponse.json({ error: 'Unknown domain' }, { status: 404 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('display_name', username)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const baseUrl = 'https://milyfe-platform.vercel.app';

  return NextResponse.json({
    subject: resource,
    aliases: [`${baseUrl}/users/${profile.id}`],
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `${baseUrl}/api/activitypub/users/${profile.id}`,
      },
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: `${baseUrl}/profile/${profile.id}`,
      },
    ],
  }, {
    headers: {
      'Content-Type': 'application/jrd+json',
      'Cache-Control': 'max-age=3600',
    },
  });
}
