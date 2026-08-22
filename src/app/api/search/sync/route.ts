import { NextRequest, NextResponse } from 'next/server';
import { indexDocument, removeDocument } from '@/lib/search/meilisearch';

/**
 * Webhook endpoint for syncing content to Meilisearch.
 * Can be called by Supabase Database Webhooks on INSERT/UPDATE/DELETE
 * or triggered manually after content creation.
 * 
 * POST /api/search/sync
 * Body: { action: 'upsert' | 'delete', index: string, document: object }
 */
export async function POST(request: NextRequest) {
  try {
    const { action, index, document } = await request.json();

    if (!index || !document?.id) {
      return NextResponse.json({ error: 'index and document.id required' }, { status: 400 });
    }

    if (action === 'delete') {
      await removeDocument(index, document.id);
    } else {
      await indexDocument(index, document);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
