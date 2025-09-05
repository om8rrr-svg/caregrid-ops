import { NextRequest, NextResponse } from 'next/server';

interface StepResult {
  name: string;
  ok: boolean;
  ms: number;
  data?: unknown;
  error?: string;
}

interface SyntheticResult {
  startedAt: string;
  finishedAt?: string;
  steps: StepResult[];
  ok?: boolean;
}

async function step(name: string, fn: () => Promise<unknown>): Promise<StepResult> {
  const start = performance.now();
  try {
    const data = await fn();
    return { name, ok: true, ms: Math.round(performance.now() - start), data };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'error';
    return { name, ok: false, ms: Math.round(performance.now() - start), error };
  }
}

export async function GET(request: NextRequest) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const SYN_EMAIL = process.env.SYNTHETIC_USER_EMAIL || '';
  const SYN_PASS = process.env.SYNTHETIC_USER_PASSWORD || '';
  
  const result: SyntheticResult = { startedAt: new Date().toISOString(), steps: [] };
  const headersJson = { 'Content-Type': 'application/json' };

  const login = await step('login', async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30_000);
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: headersJson,
      body: JSON.stringify({ email: SYN_EMAIL, password: SYN_PASS }),
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!res.ok) throw new Error(`login ${res.status}`);
    const json = await res.json();
    if (!json?.token) throw new Error('no token');
    return { token: json.token };
  });
  result.steps.push(login);
  const token = login.ok && login.data && typeof login.data === 'object' && 'token' in login.data 
    ? (login.data as { token: string }).token 
    : null;

  const list = await step('listClinics', async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30_000);
    const res = await fetch(`${API_BASE}/api/clinics?limit=1`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!res.ok) throw new Error(`list clinics ${res.status}`);
    const json = await res.json();
    return { count: Array.isArray(json) ? json.length : (json?.data?.length ?? 0) };
  });
  result.steps.push(list);

  result.ok = result.steps.every((s: StepResult) => s.ok);
  result.finishedAt = new Date().toISOString();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}