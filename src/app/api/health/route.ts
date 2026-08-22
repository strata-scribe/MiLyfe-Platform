import { NextResponse } from 'next/server';

/**
 * Health check endpoint for uptime monitoring.
 * Returns platform status, version, and basic system info.
 */
export async function GET() {
  const start = Date.now();

  // Check Supabase connectivity
  let dbStatus = 'unknown';
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
      signal: AbortSignal.timeout(5000),
    });
    dbStatus = res.ok ? 'healthy' : 'degraded';
  } catch {
    dbStatus = 'unreachable';
  }

  const responseTime = Date.now() - start;

  return NextResponse.json({
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : undefined,
    checks: {
      database: dbStatus,
      response_time_ms: responseTime,
    },
    environment: process.env.NODE_ENV,
  });
}
