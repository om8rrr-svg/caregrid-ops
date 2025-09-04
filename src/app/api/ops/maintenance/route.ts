import { NextResponse } from 'next/server';

let state = { enabled: false, message: '', updatedAt: new Date().toISOString() };

export async function GET() {
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  state.enabled = Boolean(body?.enabled);
  state.message = String(body?.message || '');
  state.updatedAt = new Date().toISOString();
  return NextResponse.json(state);
}