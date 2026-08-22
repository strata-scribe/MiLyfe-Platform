/**
 * Auto-sync content to Meilisearch after creation/update.
 * Call this after inserting into Supabase tables that should be searchable.
 */

export async function syncToSearch(index: string, document: Record<string, any>) {
  try {
    await fetch('/api/search/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', index, document }),
    });
  } catch {
    // Silent fail — search indexing is non-critical
  }
}

export async function removeFromSearch(index: string, documentId: string) {
  try {
    await fetch('/api/search/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', index, document: { id: documentId } }),
    });
  } catch {
    // Silent fail
  }
}
