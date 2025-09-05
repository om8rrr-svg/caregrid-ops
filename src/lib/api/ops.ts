export async function runHealth() {
  const res = await fetch('/api/ops/health', { method: 'GET', cache: 'no-store' });
  return await res.json();
}