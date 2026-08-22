/**
 * Meilisearch integration for MiLyfe platform.
 * 
 * Provides real full-text search across dynamic content:
 * - Forum posts
 * - Marketplace listings
 * - Wiki pages
 * - Courses
 * - News articles
 * - User profiles
 * 
 * Falls back to the static APP_INDEX for app/feature navigation.
 * 
 * Setup: Deploy Meilisearch (Docker) and set env vars:
 * - NEXT_PUBLIC_MEILISEARCH_URL (e.g., http://localhost:7700)
 * - MEILISEARCH_ADMIN_KEY (server-side only, for indexing)
 */

import { APP_INDEX, searchApps, type SearchResult } from './search-index';

// Meilisearch client config
const MEILI_URL = process.env.NEXT_PUBLIC_MEILISEARCH_URL || '';
const MEILI_SEARCH_KEY = process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY || '';

interface MeiliHit {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: string;
  href: string;
  icon?: string;
  category?: string;
}

interface MeiliSearchResponse {
  hits: MeiliHit[];
  query: string;
  processingTimeMs: number;
  estimatedTotalHits: number;
}

/**
 * Search across all content — combines Meilisearch (dynamic) + static app index.
 */
export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  // Always include static app results
  const staticResults = searchApps(query);

  // If Meilisearch is not configured, return static only
  if (!MEILI_URL || !MEILI_SEARCH_KEY) {
    return staticResults;
  }

  try {
    // Search dynamic content via Meilisearch multi-index search
    const response = await fetch(`${MEILI_URL}/multi-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEILI_SEARCH_KEY}`,
      },
      body: JSON.stringify({
        queries: [
          { indexUid: 'forum_posts', q: query, limit: 5, attributesToRetrieve: ['id', 'title', 'space_slug'] },
          { indexUid: 'marketplace_listings', q: query, limit: 5, attributesToRetrieve: ['id', 'title', 'type'] },
          { indexUid: 'wiki_pages', q: query, limit: 5, attributesToRetrieve: ['id', 'title', 'slug', 'category'] },
          { indexUid: 'courses', q: query, limit: 5, attributesToRetrieve: ['id', 'title', 'category'] },
          { indexUid: 'profiles', q: query, limit: 3, attributesToRetrieve: ['id', 'display_name', 'bio'] },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Meilisearch query failed, using static results only');
      return staticResults;
    }

    const data = await response.json();
    const dynamicResults: SearchResult[] = [];

    // Process each index's results
    for (const result of data.results || []) {
      for (const hit of result.hits || []) {
        const mapped = mapHitToResult(hit, result.indexUid);
        if (mapped) dynamicResults.push(mapped);
      }
    }

    // Combine: static results first (they're navigation), then dynamic content
    return [...staticResults.slice(0, 4), ...dynamicResults].slice(0, 15);
  } catch (err) {
    console.warn('Meilisearch unavailable, using static results:', err);
    return staticResults;
  }
}

/**
 * Map a Meilisearch hit to a SearchResult
 */
function mapHitToResult(hit: any, indexUid: string): SearchResult | null {
  switch (indexUid) {
    case 'forum_posts':
      return {
        id: `forum-${hit.id}`,
        type: 'content',
        title: hit.title,
        description: 'Forum post',
        href: `/forum/${hit.space_slug || 'general'}/${hit.id}`,
        icon: '💬',
        app: 'Forum',
        keywords: [],
      };
    case 'marketplace_listings':
      return {
        id: `market-${hit.id}`,
        type: 'content',
        title: hit.title,
        description: `${hit.type || 'Listing'} on MiMarket`,
        href: `/market/${hit.id}`,
        icon: '🛍️',
        app: 'Market',
        keywords: [],
      };
    case 'wiki_pages':
      return {
        id: `wiki-${hit.id}`,
        type: 'content',
        title: hit.title,
        description: `Wiki: ${hit.category || 'general'}`,
        href: `/wiki/${hit.slug || hit.id}`,
        icon: '📖',
        app: 'Wiki',
        keywords: [],
      };
    case 'courses':
      return {
        id: `course-${hit.id}`,
        type: 'content',
        title: hit.title,
        description: `Course: ${hit.category || ''}`,
        href: `/learn/${hit.id}`,
        icon: '📚',
        app: 'Learn',
        keywords: [],
      };
    case 'profiles':
      return {
        id: `user-${hit.id}`,
        type: 'person',
        title: hit.display_name,
        description: hit.bio || 'Community member',
        href: `/social/${hit.id}`,
        icon: '👤',
        keywords: [],
      };
    default:
      return null;
  }
}

/**
 * Server-side: Sync a record to Meilisearch index.
 * Call this after inserts/updates to keep the search index fresh.
 */
export async function indexDocument(
  indexUid: string,
  document: Record<string, any>
): Promise<void> {
  const adminKey = process.env.MEILISEARCH_ADMIN_KEY;
  if (!MEILI_URL || !adminKey) return;

  try {
    await fetch(`${MEILI_URL}/indexes/${indexUid}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`,
      },
      body: JSON.stringify([document]),
    });
  } catch (err) {
    console.error(`Failed to index document in ${indexUid}:`, err);
  }
}

/**
 * Server-side: Remove a document from Meilisearch index.
 */
export async function removeDocument(indexUid: string, documentId: string): Promise<void> {
  const adminKey = process.env.MEILISEARCH_ADMIN_KEY;
  if (!MEILI_URL || !adminKey) return;

  try {
    await fetch(`${MEILI_URL}/indexes/${indexUid}/documents/${documentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminKey}` },
    });
  } catch (err) {
    console.error(`Failed to remove document from ${indexUid}:`, err);
  }
}
