import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

async function timed<T>(fn: () => Promise<T>) {
  const start = performance.now();
  try {
    const data = await fn();
    const latencyMs = Math.round(performance.now() - start);
    return { ok: true, latencyMs, data };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return { ok: false, latencyMs, error: err?.message || 'error' };
  }
}

export async function GET() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA || 'dev-local';
  const now = new Date().toISOString();

  const backend = await timed(async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30_000);
    const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error(`backend ${res.status}`);
    return await res.json().catch(() => ({}));
  });

  const database = await timed(async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30_000);
    const res = await fetch(`${API_BASE}/api/clinics?limit=1`, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error(`db probe ${res.status}`);
    return await res.json().catch(() => ({}));
  });

  return NextResponse.json({
    time: now,
    version,
    backend: { status: backend.ok ? 'ok' : 'fail', latencyMs: backend.latencyMs },
    database: { status: database.ok ? 'ok' : 'fail', latencyMs: database.latencyMs }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
}