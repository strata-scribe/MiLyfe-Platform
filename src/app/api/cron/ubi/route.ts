import { NextResponse } from 'next/server';
import { distributeUBI } from '@/lib/actions/wallet';

/**
 * UBI Distribution Cron
 * Triggered daily by Vercel Cron or external scheduler.
 * POST /api/cron/ubi with { secret: UBI_CRON_SECRET }
 */
export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    const result = await distributeUBI(secret);

    if ('error' in result) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Also support GET with header auth (for Vercel Cron)
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const secret = authHeader?.replace('Bearer ', '') || '';

  if (secret !== process.env.UBI_CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await distributeUBI(secret);
  return NextResponse.json(result);
}
