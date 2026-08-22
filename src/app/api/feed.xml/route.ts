import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * RSS Feed for public MiLyfe content.
 * Includes: community feed posts, news articles, governance proposals.
 */
export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: posts } = await supabase
    .from('feed_posts')
    .select('id, content, created_at, profiles!feed_posts_user_id_fkey(display_name)')
    .order('created_at', { ascending: false })
    .limit(20);

  const baseUrl = 'https://milyfe-platform.vercel.app';
  const items = (posts || []).map((post: any) => `
    <item>
      <title>${escapeXml(post.content.slice(0, 80))}</title>
      <link>${baseUrl}/feed</link>
      <description>${escapeXml(post.content)}</description>
      <author>${escapeXml(post.profiles?.display_name || 'Community member')}</author>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      <guid isPermaLink="false">${post.id}</guid>
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MiLyfe Community Feed</title>
    <link>${baseUrl}</link>
    <description>Community posts from MiLyfe — Jacksonville's civic engagement platform.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
    },
  });
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
