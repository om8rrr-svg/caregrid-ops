// Operations API functions

export async function toggleMaintenance(enabled: boolean, message?: string) {
  const res = await fetch('/api/ops/maintenance', {
    method: 'POST',
    body: JSON.stringify({ enabled, message }),
    headers: { 'Content-Type': 'application/json' },
  });
  return await res.json();
}

export async function getMaintenanceStatus() {
  const res = await fetch('/api/ops/maintenance', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return await res.json();
}