export async function runSynthetic() {
  const res = await fetch('/api/ops/synthetic', { method: 'GET', cache: 'no-store' });
  return await res.json();
}