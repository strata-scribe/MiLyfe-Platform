import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

/**
 * Global Search API
 *
 * Searches across profiles, resources, proposals, quests, and learn paths.
 * Rate limited: 20 per minute per user.
 */

export async function GET(request: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit
  const rl = await checkRateLimit(user.id, 'search', RATE_LIMITS.search);
  if (!rl.success) return rl.error!;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${q}%`;

  // Parallel search across multiple tables
  const [profiles, resources, proposals, quests, paths] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, neighborhood')
      .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('community_resources')
      .select('id, name, category, address')
      .ilike('name', pattern)
      .in('status', ['active', 'stale'])
      .limit(5),
    supabase
      .from('proposals')
      .select('id, title, category, status')
      .ilike('title', pattern)
      .limit(5),
    supabase
      .from('quests')
      .select('id, title, category, reward_mly')
      .ilike('title', pattern)
      .eq('status', 'open')
      .limit(5),
    supabase
      .from('learn_paths')
      .select('id, slug, title, icon, description')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .eq('is_active', true)
      .limit(5),
  ]);

  // Combine and format results
  const results: any[] = [];

  for (const p of profiles.data || []) {
    results.push({
      id: p.id,
      type: 'profile',
      title: p.display_name || p.username,
      subtitle: `@${p.username}${p.neighborhood ? ` · ${p.neighborhood}` : ''}`,
      href: `/profile/${p.username}`,
      icon: '👤',
    });
  }

  for (const r of resources.data || []) {
    results.push({
      id: r.id,
      type: 'resource',
      title: r.name,
      subtitle: `${r.category}${r.address ? ` · ${r.address}` : ''}`,
      href: '/street',
      icon: '📍',
    });
  }

  for (const p of proposals.data || []) {
    results.push({
      id: p.id,
      type: 'proposal',
      title: p.title,
      subtitle: `${p.category} · ${p.status}`,
      href: `/governance/${p.id}`,
      icon: '🗳️',
    });
  }

  for (const q2 of quests.data || []) {
    results.push({
      id: q2.id,
      type: 'quest',
      title: q2.title,
      subtitle: `${q2.category} · ${q2.reward_mly} $MLY`,
      href: '/street',
      icon: '⚡',
    });
  }

  for (const p of paths.data || []) {
    results.push({
      id: p.id,
      type: 'path',
      title: p.title,
      subtitle: p.description?.slice(0, 60) || '',
      href: `/learn/${p.slug}`,
      icon: p.icon || '📚',
    });
  }

  return NextResponse.json({ results: results.slice(0, 15) });
}
