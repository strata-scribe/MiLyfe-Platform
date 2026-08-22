/**
 * Mi AI — Retrieval Augmented Generation (RAG)
 * 
 * Searches courses, wiki, and resources to provide context-grounded answers.
 * Uses Supabase full-text search (no vector DB required — upgrade to pgvector later).
 */

import { createClient } from '@/lib/supabase/client';

export interface RAGResult {
  source: 'course' | 'wiki' | 'resource' | 'constitution';
  title: string;
  content: string;
  relevance: number;
  link?: string;
}

/**
 * Search across all knowledge sources for relevant context
 */
export async function searchKnowledge(query: string, maxResults: number = 5): Promise<RAGResult[]> {
  const supabase = createClient();
  const results: RAGResult[] = [];
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const searchPattern = terms.join(' & ');

  // Search courses
  try {
    const { data: courses } = await supabase
      .from('courses')
      .select('title, description, category')
      .or(`title.ilike.%${terms[0]}%,description.ilike.%${terms[0]}%`)
      .limit(3);

    if (courses) {
      for (const c of courses) {
        results.push({
          source: 'course',
          title: c.title,
          content: c.description,
          relevance: calculateRelevance(query, `${c.title} ${c.description}`),
          link: '/learn',
        });
      }
    }
  } catch { /* non-critical */ }

  // Search wiki pages
  try {
    const { data: pages } = await supabase
      .from('wiki_pages')
      .select('title, content_md, slug')
      .or(`title.ilike.%${terms[0]}%,content_md.ilike.%${terms[0]}%`)
      .limit(3);

    if (pages) {
      for (const p of pages) {
        results.push({
          source: 'wiki',
          title: p.title,
          content: p.content_md.slice(0, 500),
          relevance: calculateRelevance(query, `${p.title} ${p.content_md}`),
          link: '/wiki',
        });
      }
    }
  } catch { /* non-critical */ }

  // Search resources
  try {
    const { data: resources } = await supabase
      .from('resources')
      .select('name, description, category, phone, address')
      .or(`name.ilike.%${terms[0]}%,description.ilike.%${terms[0]}%,category.ilike.%${terms[0]}%`)
      .limit(3);

    if (resources) {
      for (const r of resources) {
        results.push({
          source: 'resource',
          title: r.name,
          content: `${r.description || ''} ${r.category} ${r.phone || ''} ${r.address || ''}`.trim(),
          relevance: calculateRelevance(query, `${r.name} ${r.description} ${r.category}`),
          link: '/resources',
        });
      }
    }
  } catch { /* non-critical */ }

  // Sort by relevance and return top results
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
}

/**
 * Build RAG context string for the AI prompt
 */
export async function buildRAGContext(query: string): Promise<string> {
  const results = await searchKnowledge(query, 3);
  
  if (results.length === 0) return '';

  const contextBlocks = results.map(r => 
    `[${r.source.toUpperCase()}: ${r.title}]\n${r.content.slice(0, 300)}`
  );

  return `\n\nRELEVANT CONTEXT FROM MILYFE KNOWLEDGE BASE:\n${contextBlocks.join('\n\n')}\n\nUse this context to inform your answer when relevant. Cite sources.`;
}

/**
 * Simple keyword relevance scoring (0-1)
 */
function calculateRelevance(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const textLower = text.toLowerCase();
  
  let matches = 0;
  for (const term of queryTerms) {
    if (textLower.includes(term)) matches++;
  }

  return queryTerms.length > 0 ? matches / queryTerms.length : 0;
}
