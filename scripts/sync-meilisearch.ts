/**
 * Sync Supabase data → Meilisearch indexes
 * Run: npx tsx scripts/sync-meilisearch.ts
 */

const MEILI_URL = process.env.NEXT_PUBLIC_MEILISEARCH_URL || 'http://localhost:7700';
const MEILI_KEY = process.env.MEILISEARCH_ADMIN_KEY || '4cef5e2209d9995bb049679cc62b128978747c9764e75a05fac59ca7ba6b229b';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function syncIndex(indexUid: string, documents: any[]) {
  if (documents.length === 0) {
    console.log(`  ${indexUid}: no documents to sync`);
    return;
  }

  const res = await fetch(`${MEILI_URL}/indexes/${indexUid}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MEILI_KEY}`,
    },
    body: JSON.stringify(documents),
  });

  const data = await res.json();
  console.log(`  ${indexUid}: synced ${documents.length} documents (task ${data.taskUid})`);
}

async function fetchFromSupabase(table: string, select: string): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=1000`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    console.error(`  Failed to fetch ${table}: ${res.status}`);
    return [];
  }

  return res.json();
}

async function main() {
  console.log('Syncing Supabase → Meilisearch...\n');

  // Sync forum posts
  const posts = await fetchFromSupabase('forum_posts', 'id,title,body,space_id');
  await syncIndex('forum_posts', posts.map((p: any) => ({
    id: p.id, title: p.title, body: p.body?.substring(0, 500) || '', space_slug: p.space_id,
  })));

  // Sync marketplace listings
  const listings = await fetchFromSupabase('marketplace_listings', 'id,title,description,category,type');
  await syncIndex('marketplace_listings', listings.map((l: any) => ({
    id: l.id, title: l.title, description: l.description?.substring(0, 300) || '', category: l.category, type: l.type,
  })));

  // Sync wiki pages
  const wiki = await fetchFromSupabase('wiki_pages', 'id,title,slug,content_md,category');
  await syncIndex('wiki_pages', wiki.map((w: any) => ({
    id: w.id, title: w.title, slug: w.slug, content_md: w.content_md?.substring(0, 500) || '', category: w.category,
  })));

  // Sync courses
  const courses = await fetchFromSupabase('courses', 'id,title,description,category,difficulty');
  await syncIndex('courses', courses.map((c: any) => ({
    id: c.id, title: c.title, description: c.description?.substring(0, 300) || '', category: c.category, difficulty: c.difficulty,
  })));

  // Sync profiles
  const profiles = await fetchFromSupabase('profiles', 'id,display_name,bio,neighborhood');
  await syncIndex('profiles', profiles.map((p: any) => ({
    id: p.id, display_name: p.display_name || 'Anonymous', bio: p.bio?.substring(0, 200) || '', neighborhood: p.neighborhood || '',
  })));

  console.log('\nSync complete!');
}

main().catch(console.error);
